const fs = require('fs');
const path = require('path');
const axios = require('axios');

class QrCode {
  static async SessionCode(session, directory) {
    try {
      if (!session) {
        throw new Error('Invalid SESSION_ID format');
      }

      if (!session.startsWith('F49N')) {
        throw new Error('SESSION_ID must start with "F49N"');
      }

      const sessionId = session.includes('~')
        ? session.split('~')[1]
        : session;

      if (!sessionId) {
        throw new Error('Invalid SESSION_ID format');
      }

      const response = await axios.get(
        `https://pastebin.com/raw/${sessionId}`
      );

      if (!response.data) {
        throw new Error('Session data missing');
      }

      fs.mkdirSync(directory, {
        recursive: true
      });

      const file_path = path.join(directory, 'creds.json');

      const session_data =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      fs.writeFileSync(file_path, session_data);

      console.log('✅ Session Connected');
    } catch (error) {
      console.error(`Marc Error: ${error.message}`);
    }
  }
}

module.exports = {
  SessionCode: QrCode.SessionCode
};
