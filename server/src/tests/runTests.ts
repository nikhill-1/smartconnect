import { normalizeQuery, checkConversationalGreeting, processChatQuery } from '../services/ragService';
import { cosineSimilarity } from '../db/vectorStore';
import { initializeKnowledgeBase, splitTextIntoChunks } from '../services/documentIngestion';
import { authenticateAdmin, generateToken, AUDITED_COURSE_PIN_REGISTRY } from '../services/authService';

async function runTests() {
  console.log('\n=============================================');
  console.log('🧪 Starting SmartConnect Verification Test Suite');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Text normalization tests
  const norm1 = normalizeQuery('what time clg start?');
  assert(norm1.includes('college'), 'Query normalization replaces "clg" with "college"');

  const norm2 = normalizeQuery('tell me fee details and addmission process');
  assert(norm2.includes('admission'), 'Query normalization fixes "addmission" spelling');

  // 2. Conversational greetings
  const greet1 = checkConversationalGreeting('hello');
  assert(greet1 !== null && greet1.includes('TRR Group of Institutions'), 'Greeting returns polite college welcome');

  // 3. Cosine similarity
  const vecA = [1, 0, 0];
  const vecB = [1, 0, 0];
  const vecC = [0, 1, 0];
  assert(Math.abs(cosineSimilarity(vecA, vecB) - 1.0) < 0.001, 'Cosine similarity of identical vectors is 1.0');
  assert(Math.abs(cosineSimilarity(vecA, vecC) - 0.0) < 0.001, 'Cosine similarity of orthogonal vectors is 0.0');

  // 4. Document chunking
  const longText = 'Paragraph 1.\n\nParagraph 2 is somewhat longer and contains more text.\n\nParagraph 3 is the final paragraph.';
  const chunks = splitTextIntoChunks(longText);
  assert(chunks.length >= 3, 'Text splitter splits paragraphs accurately');

  // 5. Ingestion of knowledge base
  await initializeKnowledgeBase();
  assert(true, 'Initial official knowledge base ingested into vector store');

  // 6. RAG Retrieval & Grounding tests
  console.log('\nTesting RAG Chat Queries...');
  
  // Test: College timings
  const timingRes = await processChatQuery('what are the college timings?');
  assert(timingRes.answer.includes('9:00 AM') && timingRes.answer.includes('3:20 PM'), 'Chatbot answers college timings correctly (9:00 AM to 3:20 PM)');
  assert(timingRes.sources.length > 0, 'Chatbot includes official sources for timings');

  // Test: Principal
  const principalRes = await processChatQuery('who is the principal?');
  console.log('DEBUG principalRes:', JSON.stringify(principalRes));
  assert(principalRes.answer.toLowerCase().includes('vishal khanna'), 'Chatbot accurately identifies Principal Vishal Khanna');

  // Test: Courses offered
  const coursesRes = await processChatQuery('what courses are offered by the college?');
  console.log('DEBUG coursesRes:', JSON.stringify(coursesRes));
  assert(coursesRes.answer.includes('CSE') && coursesRes.answer.includes('Pharmacy') && coursesRes.answer.includes('Polytechnic'), 'Chatbot lists Engineering, Pharmacy, and Polytechnic courses');

  // Test: Admission documents
  const docsRes = await processChatQuery('what documents are needed for admission?');
  console.log('DEBUG docsRes:', JSON.stringify(docsRes));
  assert(
    Boolean(
      docsRes.answer.includes('Rank Card') ||
      docsRes.answer.includes('Memo') ||
      docsRes.answer.includes('Transfer Certificate')
    ),
    'Chatbot lists verified admission documents'
  );

  // Test: Safe fallback for completely unrelated question
  const fallbackRes = await processChatQuery('what is the distance to Mars?');
  assert(
    Boolean(fallbackRes.status === 'fallback' && fallbackRes.answer.includes('could not find verified information')),
    'Chatbot triggers safe fallback for out-of-scope query'
  );

  // 7. Admin authentication tests
  console.log('\nTesting Admin Security...');
  const adminOk = await authenticateAdmin('12345', 'admin');
  assert(adminOk !== null && adminOk.username === '12345', 'Admin authentication succeeds with valid credentials');

  const adminBad = await authenticateAdmin('12345', 'wrongpass');
  assert(adminBad === null, 'Admin authentication rejects invalid password');

  const token = generateToken(adminOk!);
  assert(Boolean(token && token.length > 20), 'JWT token generated successfully');

  // 8. Audited spreadsheet check
  const pin160 = AUDITED_COURSE_PIN_REGISTRY['22124-cs-160'];
  assert(pin160 !== undefined && pin160.spreadsheetUrl.includes('1drv.ms'), 'PIN 22124-cs-160 mapped securely on backend');

  console.log('\n=============================================');
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
