import React, { useState } from 'react';
import { FileText, ListOrdered, Clock, ChevronDown, ChevronUp, Search } from 'lucide-react';

const ServiceDetailView = ({ details, activeTab }) => {
  const [faqSearch, setFaqSearch] = useState('');
  
  if (!details) return null;
  
  // Handle if details is a string (double-encoded JSON)
  let parsedDetails = details;
  if (typeof details === 'string') {
      try {
          parsedDetails = JSON.parse(details);
      } catch (e) {
          console.error("Failed to parse details:", e);
          return null;
      }
  }

  const { cards, faqs } = parsedDetails;

  // Filter FAQs
  const filteredFaqs = faqs ? faqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  ) : [];

  if (!cards) return null; // Basic validation

  return (
    <div style={{ marginTop: '30px' }}>
      {/* Cards Section - Only show if activeTab is 'services' */}
      {activeTab === 'services' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          {cards.map((card, index) => (
            <div key={index} style={{ 
              background: '#fff', 
              padding: '25px', 
              borderRadius: '12px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              borderTop: '4px solid #3498db'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', color: '#2c3e50' }}>
                {card.icon === 'FileText' && <FileText size={24} color="#3498db" />}
                {card.icon === 'ListOrdered' && <ListOrdered size={24} color="#3498db" />}
                {card.icon === 'Clock' && <Clock size={24} color="#3498db" />}
                <h3 style={{ marginLeft: '10px', fontSize: '1.2rem', fontWeight: '600' }}>{card.title}</h3>
              </div>
              
              {card.items ? (
                <ul style={{ paddingLeft: '20px', color: '#555', lineHeight: '1.6' }}>
                  {card.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#555', lineHeight: '1.6' }}>{card.content}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAQs Section - Only show if activeTab is 'faq' */}
      {activeTab === 'faq' && faqs && faqs.length > 0 && (
        <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <h3 style={{ fontSize: '1.8rem', color: '#2c3e50', margin: 0 }}>Frequently Asked Questions</h3>
            
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
               <input 
                 type="text" 
                 placeholder="Search questions..." 
                 value={faqSearch}
                 onChange={(e) => setFaqSearch(e.target.value)}
                 style={{
                   width: '100%',
                   padding: '10px 15px',
                   paddingRight: '35px',
                   borderRadius: '20px',
                   border: '1px solid #ddd',
                   outline: 'none'
                 }}
               />
               <Search size={18} color="#999" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, index) => (
                <FAQItem key={index} question={faq.q} answer={faq.a} />
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No questions found matching your search.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid #eee' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '15px 0', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: '500', color: '#2c3e50' }}>{question}</span>
        {isOpen ? <ChevronUp size={20} color="#666" /> : <ChevronDown size={20} color="#666" />}
      </button>
      {isOpen && (
        <div style={{ paddingBottom: '20px', color: '#666', lineHeight: '1.6' }}>
          {answer}
        </div>
      )}
    </div>
  );
};

export default ServiceDetailView;
