import { StudentSession } from './authService';
import { DatabaseUnavailableError } from '../db/connection';
import { getAcademicRecord, AcademicRecord, ATTENDANCE_REQUIREMENT } from './studentService';
import { latestLiveCirculars } from './circularService';

export interface ChatLink {
  label: string;
  url: string;
}

export interface ToolOutcome {
  toolId: string;
  directAnswer?: string;
  privateContext?: string;
  links?: ChatLink[];
  requiresLogin?: boolean;
  sourceTitle?: string;
}

interface ChatTool {
  id: string;
  matches: (question: string) => boolean;
  requiresStudent: boolean;
  run: (session: StudentSession | null) => Promise<ToolOutcome>;
}

const PERSONAL = /\b(my|mine|me|myself|i)\b/;

const ATTENDANCE_TOPIC = /\b(attendance|shortage|classes attended|detain(ed|ion)?)\b/;
const MARKS_TOPIC = /\b(marks?|results?|grades?|scores?|cgpa|sgpa|backlogs?|arrears?|internals?|mids?|percentage)\b/;
const PROFILE_TOPIC = /\b(my (pin|name|department|branch|section|year|profile|details|id))\b/;
const CIRCULAR_TOPIC = /\b(circulars?|notices?|announcements?|notifications?|news|updates?)\b/;
const RECENCY = /\b(latest|recent|new|newest|current|today|todays|any|list|show|what are|pending|issued)\b/;

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

const SHORT_QUERY_WORDS = new Set([
  'show', 'view', 'check', 'get', 'see', 'tell', 'the', 'my', 'me', 'please', 'plz',
  'marks', 'mark', 'attendance', 'result', 'results', 'cgpa', 'sgpa', 'grade', 'grades', 'backlog', 'backlogs',
]);

function isPersonal(question: string, topic: RegExp): boolean {
  if (!topic.test(question)) return false;
  if (PERSONAL.test(question)) return true;
  const words = question.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
  return words.length > 0 && words.length <= 4 && words.every((w) => SHORT_QUERY_WORDS.has(w));
}

function formatPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function describeMarks(record: AcademicRecord): string {
  if (record.marks.length === 0) return 'No marks have been uploaded for this student yet.';
  const bySemester = new Map<string, typeof record.marks>();
  record.marks.forEach((m) => bySemester.set(m.semester, [...(bySemester.get(m.semester) || []), m]));
  const lines: string[] = [];
  for (const [semester, rows] of bySemester) {
    lines.push(`Semester ${semester}:`);
    rows.forEach((m) =>
      lines.push(`- ${m.subject} (${m.examType}): ${m.marksObtained}/${m.maxMarks} (${formatPercent(m.percentage)})`)
    );
  }
  return lines.join('\n');
}

function describeAttendance(record: AcademicRecord): string {
  if (record.attendance.length === 0) return 'No attendance has been uploaded for this student yet.';
  const lines: string[] = [];
  if (record.overallAttendance !== null) {
    lines.push(`Overall attendance: ${formatPercent(record.overallAttendance)} (minimum required: ${ATTENDANCE_REQUIREMENT}%)`);
  }
  record.attendance.forEach((a) =>
    lines.push(
      `- Semester ${a.semester}, ${a.subject}: ${a.classesAttended}/${a.classesHeld} classes (${formatPercent(a.percentage)})${
        a.percentage < ATTENDANCE_REQUIREMENT ? ' - below the required minimum' : ''
      }`
    )
  );
  return lines.join('\n');
}

function describeProfile(record: AcademicRecord): string {
  const s = record.student;
  return [
    `Name: ${s.name}`,
    `PIN: ${s.pin}`,
    `Department: ${s.department || 'not set'}`,
    `Year: ${s.year ?? 'not set'}`,
    `Section: ${s.section || 'not set'}`,
  ].join('\n');
}

async function loadRecord(session: StudentSession): Promise<AcademicRecord | null> {
  return getAcademicRecord(session.studentId);
}

const studentTool = (
  id: string,
  topic: RegExp,
  describe: (record: AcademicRecord) => string,
  title: string,
  extraMatch?: RegExp
): ChatTool => ({
  id,
  requiresStudent: true,
  matches: (q) => isPersonal(q, topic) || (extraMatch ? extraMatch.test(q) : false),
  run: async (session) => {
    if (!session) return { toolId: id, requiresLogin: true };
    const record = await loadRecord(session);
    if (!record) {
      return { toolId: id, directAnswer: 'Your student record could not be found. Please contact the administration office.' };
    }
    const text = describe(record);
    return {
      toolId: id,
      directAnswer: `${title} for ${record.student.name} (${record.student.pin}):\n${text}`,
      privateContext: `Student: ${record.student.name} (${record.student.pin}), ${record.student.department || 'department not set'}\n${title}:\n${text}`,
      sourceTitle: 'Your academic record',
    };
  },
});

const latestCircularsTool: ChatTool = {
  id: 'latest_circulars',
  requiresStudent: false,
  matches: (q) => CIRCULAR_TOPIC.test(q) && (RECENCY.test(q) || wordCount(q) <= 3),
  run: async () => {
    const items = await latestLiveCirculars(5);
    if (items.length === 0) {
      return { toolId: 'latest_circulars', directAnswer: 'There are no active circulars or notices at the moment.' };
    }
    const lines = items.map((c) => {
      const date = new Date(c.publishAt || c.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      return `- ${c.title} (${c.category}, ${date})${c.summary ? `: ${c.summary}` : ''}`;
    });
    return {
      toolId: 'latest_circulars',
      directAnswer: `Here are the latest circulars and notices:\n${lines.join('\n')}`,
      links: items.map((c) => ({ label: c.title, url: `/notices/${c.id}` })),
      sourceTitle: 'Circulars and notices',
    };
  },
};

export const chatTools: ChatTool[] = [
  studentTool('student_attendance', ATTENDANCE_TOPIC, describeAttendance, 'Attendance'),
  studentTool('student_marks', MARKS_TOPIC, describeMarks, 'Marks'),
  studentTool('student_profile', PROFILE_TOPIC, describeProfile, 'Profile', PROFILE_TOPIC),
  latestCircularsTool,
];

export async function runChatTools(
  question: string,
  session: StudentSession | null
): Promise<ToolOutcome | null> {
  const lowered = question.toLowerCase();
  const matched = chatTools.filter((t) => t.matches(lowered));
  if (matched.length === 0) return null;

  const outcomes: ToolOutcome[] = [];
  for (const tool of matched) {
    if (tool.requiresStudent && !session) {
      return { toolId: tool.id, requiresLogin: true };
    }
    try {
      outcomes.push(await tool.run(session));
    } catch (err) {
      if (err instanceof DatabaseUnavailableError) {
        return {
          toolId: tool.id,
          directAnswer: 'This information is temporarily unavailable. Please try again in a little while.',
        };
      }
      throw err;
    }
  }

  if (outcomes.length === 1) return outcomes[0];
  return {
    toolId: outcomes.map((o) => o.toolId).join('+'),
    directAnswer: outcomes.map((o) => o.directAnswer).filter(Boolean).join('\n\n'),
    privateContext: outcomes.map((o) => o.privateContext).filter(Boolean).join('\n\n'),
    links: outcomes.flatMap((o) => o.links || []),
    sourceTitle: outcomes.find((o) => o.sourceTitle)?.sourceTitle,
  };
}
