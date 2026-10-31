# Flask server deprecated in Version 1.0 modernization.
# Please run the unified Node.js Express & React application:
# npm run dev   (Development mode)
# npm start     (Production mode on port 5000)

from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def deprecated(path):
    return jsonify({
        "status": "deprecated",
        "message": "The legacy Flask static server has been deprecated. Please use the modernized SmartConnect React & Express server on port 5000 (npm run dev / npm start).",
        "url": "http://localhost:5000"
    }), 410

if __name__ == '__main__':
    print("WARNING: app.py is deprecated. Run 'npm start' or 'npm run dev' instead.")
    app.run(debug=False, port=5001)
