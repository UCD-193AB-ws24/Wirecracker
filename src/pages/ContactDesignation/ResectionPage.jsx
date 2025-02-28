const Resection = ({ electrodes, onClick }) => {
    return (
        <div className="flex-1">
            <ul className="space-y-4">
                {electrodes.map((electrode) => (
                    <li key={electrode.label} className="p-4 border rounded-lg shadow flex items-center space-x-6">
                        <p className="text-xl font-semibold min-w-[50px]">{electrode.label}</p>
                        <ul className="flex space-x-4">
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
            className={`min-w-[100px] p-4 border rounded-lg shadow cursor-pointer opacity-100 ${getMarkColor(contact)}`}
            onClick={() => onClick(contact.id, (contact) => {
                return {
                    ...contact,
                    surgeonMark: !(contact.surgeonMark)
                };
            })}
        >
            <p className="text-xl font-semibold">{contact.index}</p>
            <p className="text-sm font-semibold text-gray-500">{contact.associatedLocation}</p>
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
    }

    if (contact.surgeonMark) mark += "border-3";
    return mark;
}

export default Resection
