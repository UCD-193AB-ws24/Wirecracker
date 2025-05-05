import Electrode from './Electrode';

const Electrodes = ({
    electrodes,
    expandedElectrode,
    setExpandedElectrode,
    readOnly,
    highlightedChange,
    isSharedFile,
    fileId,
    onHighlightChange,
    handleContactUpdate,
    addElectrode,
    setSubmitFlag,
    submitFlag,
    setModifiedDate,
    checkForChanges,
    setElectrodes
}) => {
    const orderedKeys = Object.keys(electrodes).sort();

    return (
        <div className="flex flex-col justify-start m-10">
            {orderedKeys.map((key) => (
                <Electrode 
                    key={key}
                    name={key}
                    electrodes={electrodes}
                    expandedElectrode={expandedElectrode}
                    setExpandedElectrode={setExpandedElectrode}
                    readOnly={readOnly}
                    highlightedChange={highlightedChange}
                    isSharedFile={isSharedFile}
                    fileId={fileId}
                    onHighlightChange={onHighlightChange}
                    handleContactUpdate={handleContactUpdate}
                    addElectrode={addElectrode}
                    setSubmitFlag={setSubmitFlag}
                    submitFlag={submitFlag}
                    setModifiedDate={setModifiedDate}
                    checkForChanges={checkForChanges}
                    setElectrodes={setElectrodes}
                />
            ))}
        </div>
    );
};

export default Electrodes; 