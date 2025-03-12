const PlanTypePage = ({ switchContent }) => {
    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="grid gap-6">
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => switchContent('seizure-recreation')}>
                    Seizure Recreation
                </button>
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => switchContent('cceps')}>
                    CCEPs
                </button>
                <button
                    className="h-16 w-128 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
                    onClick={() => switchContent('functional-test')}>
                    Functional Mapping
                </button>
            </div>
        </div>
    );
};

export default PlanTypePage;
