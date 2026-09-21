import { useState } from 'react'
import './App.css'
import { PinataSDK } from 'pinata'

const pinata = new PinataSDK({
  pinataJwt: "",
  pinataGateway: import.meta.env.VITE_GATEWAY_URL
})

function App() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [link, setLink] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploadStatus('Getting upload URL...')
      const urlResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/presigned_url`, {
        method: "GET",
        headers: {
          // Handle your own server authorization here
        }
      })
      const data = await urlResponse.json()

      setUploadStatus('Uploading file...')

      const upload = await pinata.upload.public
        .file(file)
        .url(data.url)

      if (upload.cid) {
        setUploadStatus('File uploaded successfully!')
        const ipfsLink = await pinata.gateways.public.convert(upload.cid)
        setLink(ipfsLink)
      } else {
        setUploadStatus('Upload failed')
      }
    } catch (error) {
      setUploadStatus(`Error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export default App