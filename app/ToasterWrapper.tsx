'use client'

import toast, { ToastBar, Toaster } from "react-hot-toast"

export default function ToasterWrapper(){
    return <Toaster position="top-right">
      {(t) => (
        <div 
          onClick={() => toast.dismiss(t.id)} 
          style={{ cursor: 'pointer' }}
        >
          <ToastBar toast={t} />
        </div>
      )}
    </Toaster>
  }