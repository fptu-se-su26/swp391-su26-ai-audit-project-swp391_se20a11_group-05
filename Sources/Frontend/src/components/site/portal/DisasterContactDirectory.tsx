import React, { useState, useMemo } from "react";
import { Phone, Building, Mail, Printer, Search, User, ChevronDown } from "lucide-react";
import contactsData from "@/data/disasterContacts.json";

interface Leader {
  title: string;
  name: string;
  phone: string;
}

interface Contact {
  id: string;
  level: string;
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  fax?: string;
  leaders?: Leader[];
}

export function DisasterContactDirectory() {
  const [search, setSearch] = useState("");
  const contacts: Contact[] = contactsData;

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const lowerSearch = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(lowerSearch) ||
        c.level.toLowerCase().includes(lowerSearch)
    );
  }, [search, contacts]);

  return (
    <div className="bg-white border border-[#E4EAF2] rounded-xl overflow-hidden shadow-sm flex flex-col h-full mt-6">
      {/* Banner */}
      <div className="relative w-full h-[120px] md:h-[160px] overflow-hidden bg-gradient-to-r from-[#90d5ff] via-[#b6e4ff] to-[#e0f2fe] flex items-center justify-center rounded-t-xl shrink-0">
        {/* Abstract shapes representing waves */}
        <div className="absolute right-0 top-0 w-1/3 h-full">
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-30" preserveAspectRatio="none">
             <path d="M 0,0 C 50,50 150,50 200,0 L 200,200 L 0,200 Z" fill="#0369a1" />
          </svg>
        </div>
        <div className="absolute left-0 bottom-0 w-1/4 h-full">
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-20" preserveAspectRatio="none">
             <path d="M 0,200 C 50,150 150,150 200,200 L 200,0 L 0,0 Z" fill="#0369a1" />
          </svg>
        </div>
        
        {/* Banner Content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center gap-2 md:gap-3">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-[#cc0000] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <Phone className="text-white w-5 h-5 md:w-7 md:h-7" />
          </div>
          <h2 className="text-[#cc0000] font-bold font-sans text-base md:text-xl lg:text-2xl uppercase tracking-wide max-w-[600px] leading-tight">
            SỐ ĐIỆN THOẠI PHÒNG CHỐNG THIÊN TAI CẤP THÀNH PHỐ VÀ CẤP XÃ
          </h2>
        </div>
      </div>

      <div className="p-4 md:p-6 flex flex-col flex-1">
        {/* Search Input */}
        <div className="relative mb-6 shrink-0">
          <input
            type="text"
            placeholder="Nhập tên quận/huyện/phường/xã... (VD: Hải Châu, Sơn Trà...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-4 pr-10 rounded-full border border-[#E4EAF2] text-sm outline-none focus:border-[#0B4FC4] bg-white text-[#123E8A] placeholder-[#667085] shadow-sm font-sans"
          />
          <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#667085]" />
        </div>

        {/* Search Results / Contact Lists */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8 max-h-[500px]">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 text-slate-500 font-sans">
              Không tìm thấy thông tin cho "{search}"
            </div>
          ) : (
            filteredContacts.map((contact, index) => (
              <div key={contact.id} className="animate-fade-in">
                <h3 className="text-lg font-bold text-[#1e293b] mb-4 font-sans border-b border-slate-100 pb-2">
                  {search ? `${contact.name}` : `${index + 1}. ${contact.name}`}
                </h3>
                
                <div className="space-y-3 pl-2">
                  {contact.address && (
                    <div className="flex items-start gap-3">
                      <Building size={18} className="text-[#64748b] shrink-0 mt-0.5" />
                      <div className="text-sm font-sans">
                        <span className="text-[#475569]">Địa chỉ: </span>
                        <span className="text-[#1e293b]">{contact.address}</span>
                      </div>
                    </div>
                  )}
                  
                  {contact.email && (
                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-[#64748b] shrink-0 mt-0.5" />
                      <div className="text-sm font-sans">
                        <span className="text-[#475569]">Email: </span>
                        {contact.email.split(';').map((email, i) => (
                          <React.Fragment key={i}>
                            <a href={`mailto:${email.trim()}`} className="text-[#0ea5e9] font-medium hover:underline">
                              {email.trim()}
                            </a>
                            {i < contact.email!.split(';').length - 1 && "; "}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-[#cc0000] shrink-0 mt-0.5" />
                      <div className="text-sm font-sans">
                        <span className="text-[#475569]">SĐT trực ban: </span>
                        <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-[#0ea5e9] font-bold hover:underline">{contact.phone}</a>
                      </div>
                    </div>
                  )}
                  
                  {contact.fax && (
                    <div className="flex items-start gap-3">
                      <Printer size={18} className="text-[#64748b] shrink-0 mt-0.5" />
                      <div className="text-sm font-sans">
                        <span className="text-[#475569]">Fax: </span>
                        <span className="text-[#0ea5e9] font-bold">{contact.fax}</span>
                      </div>
                    </div>
                  )}
                  
                  {contact.leaders && contact.leaders.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed border-[#cbd5e1] space-y-2">
                      {contact.leaders.map((leader, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <User size={18} className="text-[#0ea5e9] shrink-0 mt-0.5" />
                          <div className="text-sm font-sans">
                            <span className="text-[#1e293b] font-bold">{leader.title}: </span>
                            <span className="text-[#475569]">{leader.name} - </span>
                            <a href={`tel:${leader.phone.replace(/\s/g, '')}`} className="text-[#0ea5e9] font-bold hover:underline">{leader.phone}</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
