'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [templates, setTemplates] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)
  const [playingVideo, setPlayingVideo] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData()
      setLastRefresh(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('video_jobs')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setJobs(data)

    const { data: tmplData } = await supabase.storage
      .from('templates').list()
    if (tmplData) setTemplates(tmplData)
    setLoading(false)
  }

  async function uploadTemplate(e) {
    const file = e.target.files[0]
    if (!file) return
    await supabase.storage.from('templates')
      .upload(file.name, file, { upsert: true })
    fetchData()
    alert('Template uploaded!')
  }

  const done = jobs.filter(j => j.status === 'done')
  const pending = jobs.filter(j => j.status === 'pending')
  const processing = jobs.filter(j => j.status === 'processing')

  function getInitials(name) {
    if (!name) return '??'
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  }

  function getTemplateBusinesses(templateName) {
    return jobs.filter(j => j.template_name === templateName)
  }

  function StatusBadge({ status }) {
    const styles = {
      done: { background: '#e8f5e9', color: '#2e7d32' },
      pending: { background: '#fff8e1', color: '#f57f17' },
      processing: { background: '#e3f2fd', color: '#1565c0' },
      failed: { background: '#fce4ec', color: '#c62828' },
    }
    const s = styles[status] || styles.pending
    return (
      <span style={{
        ...s, fontSize: 11, padding: '3px 10px',
        borderRadius: 20, fontWeight: 500
      }}>
        {status === 'done' ? 'Done' :
         status === 'processing' ? 'Processing...' :
         status === 'failed' ? 'Failed' : 'Pending'}
      </span>
    )
  }

  const card = {
    background: '#fff', border: '0.5px solid #e0e0e0',
    borderRadius: 12, padding: '14px 16px', marginBottom: 10
  }

  const btnPrimary = {
    background: '#1976d2', color: '#fff', border: 'none',
    borderRadius: 6, padding: '6px 14px', fontSize: 12,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
  }

  const btnSecondary = {
    background: 'none', color: '#444', border: '0.5px solid #ccc',
    borderRadius: 6, padding: '6px 14px', fontSize: 12,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      Loading dashboard...
    </div>
  )

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 20px', fontFamily: 'sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>🎬 Video Automator</h1>
          <p style={{ fontSize: 12, color: '#999', margin: '4px 0 0' }}>
            Auto-refreshes every 30s · Last: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <a href="/" style={{ ...btnPrimary, textDecoration: 'none' }}>
          + Add businesses
        </a>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 24 }}>
        {[
          { label: 'Total businesses', value: jobs.length, color: '#333' },
          { label: 'Videos completed', value: done.length, color: '#2e7d32' },
          { label: 'Processing', value: processing.length, color: '#1565c0' },
          { label: 'Pending', value: pending.length, color: '#f57f17' },
        ].map(s => (
          <div key={s.label} style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, color: '#999', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: 24, fontWeight: 600, margin: 0, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #e0e0e0', marginBottom: 20 }}>
        {['all', 'completed', 'templates'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '8px 18px', fontSize: 13, cursor: 'pointer',
            border: 'none', background: 'none',
            borderBottom: activeTab === tab ? '2px solid #1976d2' : '2px solid transparent',
            color: activeTab === tab ? '#1976d2' : '#666',
            fontWeight: activeTab === tab ? 500 : 400,
            marginBottom: -1
          }}>
            {tab === 'all' ? `All businesses (${jobs.length})` :
             tab === 'completed' ? `Completed (${done.length})` :
             `Templates (${templates.length})`}
          </button>
        ))}
      </div>

      {/* ALL BUSINESSES TAB */}
      {activeTab === 'all' && (
        <div>
          {jobs.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>
              No businesses yet. <a href="/">Add your first business</a>
            </p>
          )}
          {jobs.map(job => (
            <div key={job.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%',
                background: '#e3f2fd', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600, color: '#1565c0', flexShrink: 0
              }}>
                {getInitials(job.business_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>
                  {job.business_name || 'Unnamed business'}
                </p>
                <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                  {job.template_name || 'No template'} · {job.offer || 'No offer'}
                </p>
              </div>
              <StatusBadge status={job.status} />
              {job.status === 'done' && job.output_url && (
                <button style={btnPrimary} onClick={() => setPlayingVideo(job)}>
                  ▶ Play
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* COMPLETED TAB */}
      {activeTab === 'completed' && (
        <div>
          {done.length === 0 && (
            <p style={{ color: '#999', textAlign: 'center', padding: 40 }}>
              No completed videos yet. Videos appear here automatically when processing is done.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {done.map(job => (
              <div key={job.id} style={{ background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                {/* Video Player */}
                <div style={{ background: '#111', position: 'relative' }}>
                  {playingVideo?.id === job.id ? (
                    <video
                      controls autoPlay
                      style={{ width: '100%', display: 'block', maxHeight: 180 }}
                      src={job.output_url}
                    />
                  ) : (
                    <div
                      onClick={() => setPlayingVideo(job)}
                      style={{
                        height: 140, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', gap: 8
                      }}
                    >
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%',
                        background: '#1976d2', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, color: '#fff'
                      }}>▶</div>
                      <span style={{ fontSize: 12, color: '#aaa' }}>Click to play</span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '12px 14px' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>
                    {job.business_name}
                  </p>
                  <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px' }}>
                    {job.template_name} · {job.offer}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={job.output_url} download style={{ ...btnPrimary, textDecoration: 'none' }}>
                      ⬇ Download
                    </a>
                    <button style={btnSecondary} onClick={() => {
                      navigator.clipboard.writeText(job.output_url)
                      alert('Link copied!')
                    }}>
                      Copy link
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEMPLATES TAB */}
      {activeTab === 'templates' && (
        <div>
          {templates.map(tmpl => {
            const bizList = getTemplateBusinesses(tmpl.name)
            return (
              <div key={tmpl.name} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 2px' }}>
                      📹 {tmpl.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                      Used by {bizList.length} business{bizList.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                  <button style={btnSecondary} onClick={() => {
                    const url = supabase.storage.from('templates').getPublicUrl(tmpl.name).data.publicUrl
                    setPlayingVideo({ output_url: url, business_name: tmpl.name })
                    setActiveTab('preview_' + tmpl.name)
                  }}>
                    ▶ Preview
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {bizList.map(b => (
                    <span key={b.id} style={{
                      fontSize: 11, padding: '2px 10px', borderRadius: 20,
                      background: '#f0f4ff', color: '#1565c0',
                      border: '0.5px solid #c5d8f8'
                    }}>
                      {b.business_name}
                    </span>
                  ))}
                  {bizList.length === 0 && (
                    <span style={{ fontSize: 12, color: '#bbb' }}>No businesses using this template yet</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add new template */}
          <label style={{
            display: 'block', border: '1.5px dashed #ccc', borderRadius: 12,
            padding: 20, textAlign: 'center', cursor: 'pointer', color: '#999', fontSize: 13
          }}>
            <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>+</span>
            Upload new template video
            <input type="file" accept="video/*" style={{ display: 'none' }} onChange={uploadTemplate} />
          </label>
        </div>
      )}

      {/* Video Modal */}
      {playingVideo && activeTab !== 'completed' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ background: '#111', borderRadius: 12, overflow: 'hidden', maxWidth: 640, width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' }}>
              <p style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 500 }}>
                {playingVideo.business_name}
              </p>
              <button onClick={() => setPlayingVideo(null)} style={{
                background: 'none', border: 'none', color: '#aaa',
                fontSize: 20, cursor: 'pointer'
              }}>✕</button>
            </div>
            <video controls autoPlay style={{ width: '100%', display: 'block' }} src={playingVideo.output_url} />
          </div>
        </div>
      )}
    </div>
  )
}
