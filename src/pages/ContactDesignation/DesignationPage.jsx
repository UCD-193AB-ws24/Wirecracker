import React, { useState, useEffect } from 'react';

const Designation = ({ electrodes, onClick }) => {
    const [filterChar, setFilterChar] = useState('');
    const [filteredElectrodes, setFilteredElectrodes] = useState(electrodes);

    useEffect(() => {
        if (filterChar === '') {
            setFilteredElectrodes(electrodes);
        } else {
            const filtered = electrodes.filter(electrode =>
                electrode.label.toLowerCase().startsWith(filterChar)
            );
            setFilteredElectrodes(filtered);
        }
    }, [electrodes, filterChar]);

    // Handle keydown events
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' || event.key === 'Backspace' || event.keyCode === 8 || event.key.toLowerCase() === filterChar) {
                setFilterChar('');
            } else if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
                const char = event.key.toLowerCase();
                setFilterChar(char);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [filterChar]);

    return (
        <div className="flex-1 p-4 bg-gray-100 h-full lg:p-8">
            <div className="mb-3 lg:mb-6">
                <p className="text-sm text-gray-700 lg:text-lg">
                    Filtering electrodes by: {filterChar || 'None'} (Press a key to filter, Esc or Backspace to reset)
                </p>
            </div>
            <ul className="space-y-3 lg:space-y-6">
                {filteredElectrodes.map((electrode) => (
                    <li
                        className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm
                                   lg:p-6"
                        key={electrode.label}
                    >
                        <p className="text-lg font-bold text-gray-800 mb-2
                                      lg:text-2xl lg:mb-4">
                            {electrode.label}
                        </p>
                        <ul className="flex flex-wrap gap-2
                                       lg:gap-4">
                            {electrode.contacts.map((contact) => (
                                <Contact
                                    key={contact.id}
                                    contact={contact}
                                    onClick={onClick}
                                />
                            ))}
                        </ul>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const Contact = ({ contact, onClick }) => {
    return (
        <li
            className={`w-[75px] p-2 rounded-lg shadow-sm cursor-pointer flex-shrink-0 transition-transform transform hover:scale-105 ${getMarkColor(contact)}
                        lg:w-[100px] lg:p-4`}
            onClick={() => onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    mark: (contact.mark + 1) % 4
                };
            })}
        >
            <p className="text-base font-bold text-gray-800 lg:text-xl">{contact.index}</p>
            <p className="text-xs font-medium text-gray-600 truncate lg:text-sm" title={contact.associatedLocation}>
                {contact.associatedLocation}
            </p>
        </li>
    );
};

function getMarkColor(contact) {
    let mark = "";
    switch (contact.mark) {
        case 0:
            mark = "bg-white ";
            break;
        case 1:
            mark = "bg-rose-300 ";
            break;
        case 2:
            mark = "bg-amber-300 ";
            break;
        case 3:
            mark = "bg-stone-300 ";
            break;
    }

    if (contact.surgeonMark) {
        mark += "border-2 border-stone-500";
    }
    else {
        mark += "border border-gray-300";
    }
    return mark;
}

export default Designation;
