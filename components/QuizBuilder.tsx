import React from 'react';
import { QuizQuestion } from '../types';
import { Plus, Trash, Sparkles, X, CheckCircle, Circle, AlertCircle, Type, List } from 'lucide-react';

interface QuizBuilderProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  onGenerate: () => void;
  aiLoading: boolean;
  type: 'quiz' | 'exam';
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ questions, onChange, onGenerate, aiLoading, type }) => {
  const addQuestion = () => {
    const newQ: QuizQuestion = {
      id: Date.now().toString(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };
    onChange([...questions, newQ]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    
    // Reset options/answer if type changes
    if (field === 'type' && value !== newQuestions[index].type) {
         if (value === 'short-answer') {
             newQuestions[index] = { ...newQuestions[index], type: 'short-answer', options: [], correctAnswer: '' };
         } else {
             newQuestions[index] = { ...newQuestions[index], type: 'multiple-choice', options: ['', '', '', ''], correctAnswer: 0 };
         }
    } else {
        newQuestions[index] = { ...newQuestions[index], [field]: value };
    }
    
    onChange(newQuestions);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    if (newQuestions[qIndex].options) {
        const newOptions = [...newQuestions[qIndex].options!];
        newOptions[oIndex] = value;
        newQuestions[qIndex].options = newOptions;
        onChange(newQuestions);
    }
  };

  const removeQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    onChange(newQuestions);
  };

  return (
    <div className="space-y-6 mt-4 border-t border-gray-100 pt-6">
      <div className="flex justify-between items-center">
        <div>
            <h5 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                {type === 'exam' ? 'Final Exam Questions' : 'Quiz Questions'}
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-bold border border-pink-200">{questions.length}</span>
            </h5>
            <p className="text-xs text-gray-400 mt-1">Define questions and mark the correct answer.</p>
        </div>
        <button
            type="button"
            onClick={onGenerate}
            disabled={aiLoading}
            className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg flex items-center shadow-md hover:shadow-lg transition disabled:opacity-50"
        >
            <Sparkles size={14} className="mr-2" />
            {aiLoading ? 'Designing Questions...' : 'Auto-Fill with AI'}
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
            <div key={q.id || qIdx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative group hover:border-pink-200 transition">
                <div className="absolute top-3 right-3 flex gap-2">
                     <span className="text-xs font-mono text-gray-300 select-none">ID: {qIdx + 1}</span>
                    <button
                        type="button"
                        onClick={() => removeQuestion(qIdx)}
                        className="text-gray-300 hover:text-red-500 transition"
                        title="Remove Question"
                    >
                        <X size={16} />
                    </button>
                </div>
                
                <div className="mb-4 pr-8">
                     <div className="flex justify-between items-center mb-2">
                         <label className="block text-xs font-bold text-gray-500 uppercase">Question Text</label>
                         <div className="flex bg-gray-100 rounded-lg p-0.5">
                             <button
                                type="button" 
                                onClick={() => updateQuestion(qIdx, 'type', 'multiple-choice')}
                                className={`p-1 rounded-md text-xs flex items-center gap-1 ${q.type !== 'short-answer' ? 'bg-white shadow-sm text-pink-600 font-bold' : 'text-gray-500'}`}
                             >
                                 <List size={12}/> Choice
                             </button>
                             <button 
                                type="button"
                                onClick={() => updateQuestion(qIdx, 'type', 'short-answer')}
                                className={`p-1 rounded-md text-xs flex items-center gap-1 ${q.type === 'short-answer' ? 'bg-white shadow-sm text-pink-600 font-bold' : 'text-gray-500'}`}
                             >
                                 <Type size={12}/> Text Answer
                             </button>
                         </div>
                     </div>
                    <textarea
                        rows={2}
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, 'question', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition resize-none bg-gray-50 focus:bg-white"
                        placeholder="e.g., What is the primary function of a base coat?"
                    />
                </div>

                {q.type === 'short-answer' ? (
                     <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Model Answer (For Grading Reference)</label>
                        <textarea
                            rows={2}
                            value={q.correctAnswer as string}
                            onChange={(e) => updateQuestion(qIdx, 'correctAnswer', e.target.value)}
                            className="w-full border border-green-200 bg-green-50 rounded-lg p-3 text-sm focus:outline-none focus:border-green-400"
                            placeholder="Enter the correct answer or key points here..."
                        />
                     </div>
                ) : (
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Answers (Select Correct One)</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options?.map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg border transition ${q.correctAnswer === oIdx ? 'border-green-400 bg-green-50' : 'border-transparent bg-white hover:bg-gray-50'}`}>
                                    <button
                                        type="button"
                                        onClick={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                                        className={`flex-shrink-0 transition-transform active:scale-95 ${q.correctAnswer === oIdx ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}
                                        title="Mark as correct answer"
                                    >
                                        {q.correctAnswer === oIdx ? <CheckCircle size={20} className="fill-green-100" /> : <Circle size={20} />}
                                    </button>
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                                        className={`w-full text-sm border-b border-gray-200 bg-transparent px-1 py-1 outline-none focus:border-pink-400 transition ${q.correctAnswer === oIdx ? 'text-green-800 font-medium' : 'text-gray-600'}`}
                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        ))}

        {questions.length === 0 && (
            <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                <p className="text-sm">No questions yet.</p>
                <p className="text-xs">Click "Add Question" or use "Auto-Fill with AI"</p>
            </div>
        )}
      </div>

      <button
        type="button"
        onClick={addQuestion}
        className="w-full py-3 border border-gray-300 rounded-xl text-gray-600 text-sm font-bold hover:bg-gray-50 hover:border-pink-300 hover:text-pink-600 transition flex justify-center items-center shadow-sm"
      >
        <Plus size={16} className="mr-2" /> Add New Question Manually
      </button>
    </div>
  );
};