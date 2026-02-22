export default function handler(req, res) {
  const cfg = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  };

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.status(200).send(`window.__FIREBASE_CONFIG__ = ${JSON.stringify(cfg)};`);
}
