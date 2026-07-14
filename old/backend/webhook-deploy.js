const express = require('express')
const { exec } = require('child_process')
const crypto = require('crypto')

const app = express()
app.use(express.json())

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-here'

app.post('/webhook/deploy', (req, res) => {
  const signature = req.headers['x-hub-signature-256']
  const payload = JSON.stringify(req.body)

  // Verify GitHub signature
  const expectedSignature = 'sha256=' + crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')

  if (signature !== expectedSignature) {
    return res.status(401).send('Unauthorized')
  }

  // Check if push to dev branch
  if (req.body.ref === 'refs/heads/dev') {
    console.log('Deploying to DEV environment...')

    exec('./deploy-dev-mydevil-compiled', (error, stdout, stderr) => {
      if (error) {
        console.error('Deploy failed:', error)
        return res.status(500).send('Deploy failed')
      }
      console.log('Deploy successful:', stdout)
      res.send('Deploy successful')
    })
  } else {
    res.send('Not dev branch, skipping deploy')
  }
})

app.listen(3001, () => {
  console.log('Webhook server running on port 3001')
})
