import { useEffect } from "react";

const PlanTypePage = ({ initialData = {}, onStateChange, switchContent }) => {
    // Parse CSV and put into a format that contact selection can use.
    useEffect(() => {
        onStateChange({electrodes: initialData.data});
    }, [initialData]);

    return (
        <div className="flex justify-center items-center h-full bg-gray-100">
            <div className="grid gap-3 lg:gap-6">
                <button
                    className="h-10 w-68 bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white font-semibold rounded cursor-pointer transition-colors duration-200
                               md:h-11 md:w-80 md:text-lg
                               lg:h-13 lg:w-96 lg:text-xl
                               xl:h-16 xl:w-128 xl:text-2xl"
                    onClick={() => switchContent('seizure-recreation')}>
                    Seizure Recreation
                </button>
                <button
                    className="h-10 w-68 bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white font-semibold rounded cursor-pointer transition-colors duration-200
                               md:h-11 md:w-80 md:text-lg
                               lg:h-13 lg:w-96 lg:text-xl
                               xl:h-16 xl:w-128 xl:text-2xl"
                    onClick={() => switchContent('cceps')}>
                    CCEPs
                </button>
                <button
                    className="h-10 w-68 bg-sky-600 hover:bg-sky-700 border border-sky-700 text-white font-semibold rounded cursor-pointer transition-colors duration-200
                               md:h-11 md:w-80 md:text-lg
                               lg:h-13 lg:w-96 lg:text-xl
                               xl:h-16 xl:w-128 xl:text-2xl"
                    onClick={() => switchContent('functional-mapping')}>
                    Functional Mapping
                </button>
            </div>
        </div>
    );
};

export default PlanTypePage;
