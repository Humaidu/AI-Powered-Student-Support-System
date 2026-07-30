import React, { useState } from 'react';
import { SideNavBar } from '../components/SideNavBar';
import { TopNavBar } from '../components/TopNavBar';
import { SupportTicketModal } from '../components/SupportTicketModal';
import { useDocuments } from '../hooks/useDocuments';

export const AdminDashboardPage: React.FC = () => {
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('Academic Policy');
  const [uploadDepartment, setUploadDepartment] = useState('Academic Affairs');

  const { documents, uploadDocument, isUploading, approveDocument, deleteDocument } = useDocuments();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadDocument({
      file,
      metadata: {
        category: uploadCategory,
        department: uploadDepartment,
        author: 'Faculty Administrator',
        version: 'v1.0'
      }
    });
  };

  const pendingDocs = documents.filter(d => d.approvalStatus === 'PENDING_REVIEW');
  const approvedDocs = documents.filter(d => d.approvalStatus === 'APPROVED');

  return (
    <div className="flex h-screen w-screen bg-[#f8f9ff] overflow-hidden">
      {/* Side Navigation Bar */}
      <SideNavBar onOpenSupportTicket={() => setSupportModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        {/* Top Navigation */}
        <TopNavBar searchPlaceholder="Search documents, vector indexes, or audit logs..." />

        {/* Admin Dashboard Container */}
        <main className="p-6 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00355f] text-white rounded-full text-xs font-bold uppercase mb-2">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                Administrative Portal
              </div>
              <h1 className="font-headline text-2xl font-bold text-[#00355f]">
                RAG Pipeline & Document Governance
              </h1>
              <p className="text-sm text-[#42474f] mt-1">
                Manage OpenSearch vector embeddings, institutional document ingestion, and approval workflows.
              </p>
            </div>
          </div>

          {/* Statistics Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#0f4c81]">
                <span className="text-xs font-bold uppercase text-[#727780]">Indexed Documents</span>
                <span className="material-symbols-outlined">folder_open</span>
              </div>
              <p className="font-headline text-3xl font-extrabold text-[#00355f]">{documents.length}</p>
              <p className="text-[11px] text-[#42474f]">{approvedDocs.length} approved & searchable</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#0f4c81]">
                <span className="text-xs font-bold uppercase text-[#727780]">Vector Chunks</span>
                <span className="material-symbols-outlined">dataset</span>
              </div>
              <p className="font-headline text-3xl font-extrabold text-[#00355f]">{documents.length * 28 + 142}</p>
              <p className="text-[11px] text-[#42474f]">OpenSearch k-NN 10-Dim Vectors</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#0f4c81]">
                <span className="text-xs font-bold uppercase text-[#727780]">Pending Approval</span>
                <span className="material-symbols-outlined">pending_actions</span>
              </div>
              <p className="font-headline text-3xl font-extrabold text-[#743b00]">{pendingDocs.length}</p>
              <p className="text-[11px] text-[#42474f]">Awaiting Dean / Faculty Review</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-2">
              <div className="flex items-center justify-between text-[#0f4c81]">
                <span className="text-xs font-bold uppercase text-[#727780]">RAG Latency</span>
                <span className="material-symbols-outlined">speed</span>
              </div>
              <p className="font-headline text-3xl font-extrabold text-[#00355f]">1.24s</p>
              <p className="text-[11px] text-[#8ebdf9] font-bold bg-[#00355f] px-2 py-0.5 rounded-full inline-block">Bedrock / Gemini Active</p>
            </div>
          </div>

          {/* Document Ingestion & Approval Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Box */}
            <div className="bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-4">
              <h2 className="font-headline text-lg font-bold text-[#00355f] flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px]">upload_file</span>
                Ingest New Institutional Document
              </h2>
              <p className="text-xs text-[#42474f]">
                Upload PDF files to automatically trigger the Bedrock/OpenSearch chunking & embedding pipeline.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-xs font-medium outline-none"
                  >
                    <option value="Academic Policy">Academic Policy</option>
                    <option value="Institutional Rules">Institutional Rules</option>
                    <option value="Housing">Housing</option>
                    <option value="Finance">Finance</option>
                    <option value="Research">Research</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">Department</label>
                  <input
                    type="text"
                    value={uploadDepartment}
                    onChange={(e) => setUploadDepartment(e.target.value)}
                    className="w-full p-2 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-xs outline-none"
                  />
                </div>

                <div className="border-2 border-dashed border-[#00355f]/40 hover:border-[#00355f] bg-[#eff4ff]/50 rounded-2xl p-6 text-center transition-all cursor-pointer">
                  <label className="cursor-pointer space-y-2 block">
                    <span className="material-symbols-outlined text-[36px] text-[#0f4c81]">cloud_upload</span>
                    <p className="text-xs font-bold text-[#00355f]">Click to upload or drag PDF</p>
                    <p className="text-[10px] text-[#727780]">PDF, DOCX up to 25MB</p>
                    <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>

                {isUploading && (
                  <div className="p-3 bg-[#eff4ff] border border-[#c2c7d1] rounded-xl text-xs text-[#00355f] font-semibold flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#00355f] border-t-transparent rounded-full animate-spin"></span>
                    Processing document ingestion pipeline...
                  </div>
                )}
              </div>
            </div>

            {/* Document Governance Table */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#c2c7d1] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#c2c7d1] pb-3">
                <h2 className="font-headline text-lg font-bold text-[#00355f] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                  Knowledge Base Governance ({documents.length})
                </h2>
                <span className="text-xs text-[#42474f] font-medium">Real-time AWS Pipeline Status</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#c2c7d1] text-[11px] font-bold text-[#727780] uppercase">
                      <th className="py-2.5 px-3">Document Title</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Pipeline Status</th>
                      <th className="py-2.5 px-3">Approval</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c2c7d1]/50 text-xs">
                    {documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-[#eff4ff]/60 transition-colors">
                        <td className="py-3 px-3 font-bold text-[#0b1c30]">
                          <div>{doc.title}</div>
                          <div className="text-[10px] text-[#727780] font-normal">{doc.fileName} ({doc.metadata.fileSize})</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-[#eff4ff] text-[#0f4c81] border border-[#c2c7d1] px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {doc.metadata.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            doc.status === 'COMPLETED'
                              ? 'bg-[#bbd3fd] text-[#445a7f]'
                              : doc.status === 'EMBEDDING' || doc.status === 'PROCESSING'
                              ? 'bg-[#ffdcc4] text-[#743b00]'
                              : 'bg-[#eff4ff] text-[#42474f]'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            doc.approvalStatus === 'APPROVED'
                              ? 'bg-[#dce9ff] text-[#00355f]'
                              : doc.approvalStatus === 'REJECTED'
                              ? 'bg-[#ffdad6] text-[#ba1a1a]'
                              : 'bg-[#ffdcc4] text-[#743b00]'
                          }`}>
                            {doc.approvalStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {doc.approvalStatus === 'PENDING_REVIEW' && (
                            <>
                              <button
                                onClick={() => approveDocument({ id: doc.id, status: 'APPROVED' })}
                                className="px-2.5 py-1 bg-[#00355f] text-white text-[11px] font-bold rounded-md hover:bg-[#0f4c81] cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => approveDocument({ id: doc.id, status: 'REJECTED' })}
                                className="px-2.5 py-1 bg-[#ba1a1a] text-white text-[11px] font-bold rounded-md hover:bg-[#ba1a1a]/80 cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded cursor-pointer"
                            title="Delete Document"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Support Ticket Modal */}
      <SupportTicketModal isOpen={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
    </div>
  );
};
