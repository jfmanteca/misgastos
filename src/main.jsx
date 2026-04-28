import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import OneSignal from 'react-onesignal'

export const osReady = OneSignal.init({
  appId: "36658d3c-f616-4b23-a25b-d5835fa3cff5",
  safari_web_id: "web.onesignal.auto.36658d3c-f616-4b23-a25b-d5835fa3cff5",
  notifyButton: { enable: false },
  allowLocalhostAsSecureOrigin: true,
}).catch(() => {})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
)
