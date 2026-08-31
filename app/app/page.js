'use client'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'

const emptyBusiness = {
  business_name: '', offer: '', website_url: '',
  logo: null, template_name: '', template_url: ''
}

export default function Home() {
  const [businesses, setBusinesses] = useState([{ ...emptyBusiness }])
  const [templates, setTemplates] = useState([])
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchTemplates() }, [])

  async function fetchTemplates() {
    const { data } = await supabase.storage.from('templates').list()
    if (data) setTemplates(data)
  }

  function updateBusiness(index, field, value) {
    const updated = [...businesses]
    updated[index][field] = value
    setBusinesses(updated)
  }

  function addBusiness() {
    setBusinesses([...businesses, { ...emptyBusiness }])
  }

  function removeBusiness(index) {
    setBusinesses(businesses.filter((_, i) => i !== index))
  }

  async function uploadTemplate(e) {
    const file = e.target.files[0]
    if (!file) return
    const { error } = await supabase.storage
      .from('templates').upload(file.name, file, { upsert: true })
    if (!error) { alert('Template uploaded!'); fetchTemplates() }
  }

  async function handleSubmit() {
    setUploading(true); setError(''); setSuccess('')
    try {
      for (const biz of businesses) {
        let logo_url = ''
        if (biz.logo) {
          const ext = biz.logo.name.split('.').pop()
          const filename = `${Date.now()}.${ext}`
          await supabase.storage.from('logos').upload(filename, biz.logo)
          const { data } = supabase.storage.from('logos').getPublicUrl(filename)
          logo_url = data.publicUrl
        }
        let template_url = ''
        if (biz.template_name) {
          const { data } = supabase.storage
            .from('templates').getPublicUrl(biz.template_name)
          template_url = data.publicUrl
        }
        await supabase.from('video_jobs').insert({
          business_name: biz.business_name,
          offer: biz.offer,
          website_url: biz.website_url,
          logo_url, template_name: biz.template_name,
          template_url, status: 'pending'
        })
      }
      setSuccess(`✅ ${businesses.length} job(s) added to queue!`)
      setBusinesses([{ ...emptyBusiness }])
    } catch (err) {
      setError('Something went wrong. Please try again.')
    }
    setUploading(false)
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 32, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>🎬 Video Automator</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Add businesses to your video queue</p>
      <div style={{ background: '#f0f4ff', padding: 16, borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>📁 Upload Template Video</h2>
        <input type="file" accept="video/mp4,video/mov" onChange={uploadTemplate} style={{ marginBottom: 8 }} />
        {templates.length > 0 && <p style={{ fontSize: 13, color: '#555' }}>{templates.length} template(s) available</p>}
      </div>
      {businesses.map((biz, i) => (
        <div key={i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h3 style={{ fontWeight: 'bold' }}>Business {i + 1}</h3>
            {businesses.length > 1 && <button onClick={() => removeBusiness(i)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Business Name</label>
              <input value={biz.business_name} onChange={e => updateBusiness(i, 'business_name', e.target.value)} placeholder="Acme Coffee Co." style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, marginTop: 4, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Offer</label>
              <input value={biz.offer} onChange={e => updateBusiness(i, 'offer', e.target.value)} placeholder="20% off today!" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, marginTop: 4, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Website URL</label>
              <input value={biz.website_url} onChange={e => updateBusiness(i, 'website_url', e.target.value)} placeholder="https://acmecoffee.com" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, marginTop: 4, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Select Template</label>
              <select value={biz.template_name} onChange={e => updateBusiness(i, 'template_name', e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4, marginTop: 4, boxSizing: 'border-box' }}>
                <option value="">-- Select a template --</option>
                {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 'bold' }}>Logo Image</label>
              <input type="file" accept="image/*" onChange={e => updateBusiness(i, 'logo', e.target.files[0])} style={{ display: 'block', marginTop: 4 }} />
            </div>
          </div>
        </div>
      ))}
      <button onClick={addBusiness} style={{ width: '100%', padding: 12, border: '2px dashed #aaa', borderRadius: 8, background: 'none', cursor: 'pointer', marginBottom: 16 }}>+ Add Another Business</button>
      {error && <div style={{ background: '#fee', padding: 12, borderRadius: 6, color: 'red', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ background: '#efe', padding: 12, borderRadius: 6, color: 'green', marginBottom: 12 }}>{success}</div>}
      <button onClick={handleSubmit} disabled={uploading} style={{ width: '100%', padding: 14, background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, cursor: 'pointer' }}>
        {uploading ? 'Adding to Queue...' : '🚀 Add to Queue'}
      </button>
    </div>
  )
}
