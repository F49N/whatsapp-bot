const fs = require('fs');
const path = require('path');
const axios = require('axios');

class QrCode {
  static async SessionCode(session, directory) {
    try {
      if (!session) {
        throw new Error('Invalid SESSION_ID format');
      }

      if (!session.startsWith('garfield')) {
        throw new Error('must start with "garfield"');
      }

      const sessionId = session.includes('~')
        ? session.split('~')[1]
        : session;

      const url = `https://pastebin.com/raw/${sessionId}`;
      const response = await axios.get(url);
      if (!response.data) {
        throw new Error('Session data missing');
      }

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      const fi_p = path.join(directory, 'creds.json');
      const data =
        typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data);

      fs.writeFileSync(fi_p, data);

      console.log('✅ Session Connected');
    } catch (error) {
      console.error(error.message);
    }
  }
}

module.exports = { SessionCode: QrCode.SessionCode };
