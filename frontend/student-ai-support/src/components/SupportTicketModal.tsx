import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ticketSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(15, 'Please provide a detailed description (at least 15 characters)'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      category: 'Academic',
      urgency: 'MEDIUM'
    }
  });

  if (!isOpen) return null;

  const onSubmit = async (data: TicketFormData) => {
    // Simulates API call to AWS Lambda support service
    await new Promise(res => setTimeout(res, 800));
    console.log('Support Ticket Created:', data);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      reset();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[#c2c7d1]">
        <div className="bg-[#00355f] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
            <div>
              <h3 className="font-headline font-bold text-lg">New Support Ticket</h3>
              <p className="text-xs text-[#8ebdf9]">Submit an inquiry to student administration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-[#eff4ff] text-[#0f4c81] rounded-full flex items-center justify-center mx-auto text-2xl">
              <span className="material-symbols-outlined text-[32px]">check_circle</span>
            </div>
            <h4 className="font-headline font-bold text-lg text-[#00355f]">Ticket Submitted!</h4>
            <p className="text-sm text-[#42474f]">
              Ticket #TK-2024-{Math.floor(1000 + Math.random() * 9000)} has been dispatched to the Academic Registry.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                Department / Category
              </label>
              <select
                {...register('category')}
                className="w-full p-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none"
              >
                <option value="Academic">Academic Affairs & Registration</option>
                <option value="Housing">Hostel & Accommodation</option>
                <option value="Finance">Bursar & Tuition Fees</option>
                <option value="Examinations">Examinations & Transcripts</option>
                <option value="IT">IT Support & Student Portal</option>
              </select>
              {errors.category && <p className="text-xs text-[#ba1a1a] mt-1">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                Subject
              </label>
              <input
                type="text"
                {...register('subject')}
                placeholder="e.g. Degree Audit credit evaluation delay"
                className="w-full p-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none"
              />
              {errors.subject && <p className="text-xs text-[#ba1a1a] mt-1">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                Urgency Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map(lvl => (
                  <label
                    key={lvl}
                    className="flex items-center justify-center p-2 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-xs font-semibold cursor-pointer has-[:checked]:bg-[#00355f] has-[:checked]:text-white transition-all"
                  >
                    <input type="radio" value={lvl} {...register('urgency')} className="sr-only" />
                    {lvl}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0b1c30] uppercase mb-1">
                Detailed Description
              </label>
              <textarea
                rows={4}
                {...register('description')}
                placeholder="Describe your issue or query in detail so our support staff can assist..."
                className="w-full p-2.5 bg-[#eff4ff] border border-[#c2c7d1] rounded-lg text-sm text-[#0b1c30] focus:ring-2 focus:ring-[#0f4c81]/30 focus:border-[#0f4c81] outline-none"
              />
              {errors.description && <p className="text-xs text-[#ba1a1a] mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#c2c7d1]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-[#42474f] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-bold bg-[#00355f] text-white rounded-lg hover:bg-[#0f4c81] transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
