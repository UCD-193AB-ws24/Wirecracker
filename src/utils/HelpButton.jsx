import { useState } from 'react';

/**
 * @param {String} title
 * @param {String} instructions
 * @returns {JSX.Element}
 */
const HelpButton = ({ title, instructions }) => {
    const [showLegend, setShowLegend] = useState(false);

    return (
        <div className="fixed bottom-2 left-2 z-50
                        lg:bottom-6 lg:left-6">
            {showLegend ? (
                <Legend title={title} instructions={instructions} setShowLegend={setShowLegend} />
            ) : (
                <button
                    className="size-8 border border-sky-800 bg-sky-600 text-white text-sm text-center font-bold rounded-full transition-colors duration-200 cursor-pointer hover:bg-sky-800
                                lg:size-11 lg:text-base"
                    onClick={() => setShowLegend(true)}>
                    ?
                </button>
            )}
        </div>
    )
}

/**
 * 
 * @param {String} title
 * @param {String} instructions
 * @param {Function} setShowLegend
 * @returns {JSX.Element}
 */
const Legend = ({ title, instructions, setShowLegend }) => {
    return (
        <div className="max-w-48 shadow-lg border border-gray-400 rounded bg-gray-50 p-1
                        md:max-w-72
                        lg:max-w-96 lg:p-2">
            <div className="text-center font-bold text-wrap
                            lg:text-xl">
                {title}
            </div>
            <div className="text-xs lg:text-base text-wrap">
                {instructions}
            </div>

            {/* Legend */}
            <div className="my-2 mx-2 lg:mx-5">
                <div className="text-center font-semibold text-sm
                                lg:text-lg">
                    Legend
                </div>
                <div>
                    <LegendItem color="rose" itemName="SOZ - Seizure Onset Zone" />
                    <LegendItem color="amber" itemName="EN - Epileptic Network" />
                    <LegendItem color="stone" itemName="OOB - Out of Brain" />
                    <LegendItem color="white" itemName="NI - Not Involved" />
                    <LegendItem color="white" outline="true" itemName="Marked for surgery" />
                </div>
            </div>

            <button
                className="py-2 px-4 border border-sky-800 bg-sky-600 text-white font-semibold rounded cursor-pointer transition-colors duration-200 hover:bg-sky-800"
                onClick={() => setShowLegend(false)}>
                Close
            </button>
        </div>
    );
}

/**
 * 
 * @param {String} color
 * @param {String} outline
 * @param {String} itemName
 * @returns {JSX.Element}
 */
const LegendItem = ({ color = "black", outline = "false", itemName }) => {
    const colorVariants = {
        amber: "text-amber-300",
        rose: "text-rose-300",
        stone: "text-stone-300",
        white: "text-white",
        black: "text-black"
    }
    const bolding = {
        true: "font-stone-outline-2",
        false: "font-gray-outline"
    }

    return (
        <div className="flex">
            <div className={`${colorVariants[color]} ${bolding[outline]} justify-self-start text-xs
                            lg:text-base`}>
                &#x25A0;
            </div>
            <div className="flex-1 justify-self-end text-right text-xs
                            lg:text-base">
                {itemName}
            </div>
        </div>
    );
}

export default HelpButton;