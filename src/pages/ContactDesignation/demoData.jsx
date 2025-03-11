export {demoContactData}

function contact(loc, mark, surgeonMark) {
    this.associatedLocation = loc;
    this.mark = mark;
    this.surgeonMark = surgeonMark;
}

contact.prototype = {
    constructor: contact,

    isMarked: function() {
        return this.mark || this.surgeonMark;
    }
}

let demoContactData = [
    {
        label: "TB",
        contacts: [
            new contact("GM/MedialInferiorTemporalCortex", 1, false),
            new contact("GM/MedialInferiorTemporalCortex", 0, true),
            new contact("GM/MedialInferiorTemporalCortex", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("GM/MedialInferiorTemporalCortex", 2, true),
            new contact("GM/RostralInferiorTemporalCortex", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("GM/RostralInferiorTemporalCortex", 1, true),
            new contact("GM/RostralMiddleTemporalCortex", 0, false),
            new contact("GM/RostralMiddleTemporalCortex", 2, true),
            new contact("WM", 1, false),
        ]
    },
    {
        label: "TB'",
        contacts: [
            new contact("Hippocampus", 1, false),
            new contact("WM", 0, true),
            new contact("GM/RostralInferiorTemporalCortex", 2, false),
            new contact("WM", 1, true),
            new contact("RostralInferiorTemporalCortex", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("GM/RostralMiddleTemporalCortex", 0, true),
            new contact("GM/RostralMiddleTemporalCortex", 2, false),
            new contact("GM/RostralMiddleTemporalCortex", 1, true),
            new contact("WM", 0, false),
        ]
    },
    {
        label: "TP'",
        contacts: [
            new contact("WM", 1, false),
            new contact("GM/RostralMiddleTemporalCortex", 0, true),
            new contact("GM/RostralSuperiorTemporalCortex", 2, false),
            new contact("GM/RostralSuperiorTemporalCortex", 1, true),
            new contact("GM/RostralSuperiorTemporalCortex", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("GM/RostralSuperiorTemporalCortex", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
        ]
    },
    {
        label: "A'",
        contacts: [
            new contact("GM/Amygdala", 1, false),
            new contact("GM/Amygdala", 0, true),
            new contact("GM/Amygdala", 2, false),
            new contact("GM/Amygdala", 1, true),
            new contact("GM/Amygdala", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("GM/RostralSuperiorTemporalCortex", 2, false),
            new contact("GM/RostralSuperiorTemporalCortex", 1, true),
            new contact("GM/RostralMiddleTemporalCortex", 0, false),
            new contact("WM", 2, true),
            new contact("GM/RostralMiddleTemporalCortex", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
        ]
    },
    {
        label: "OR'",
        contacts: [
            new contact("GM/VentralOrbitoFrontalCortex", 1, false),
            new contact("GM/VentralOrbitoFrontalCortex", 0, true),
            new contact("GM/VentralOrbitoFrontalCortex", 2, false),
            new contact("GM/VentralOrbitoFrontalCortex", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("GM/RostralDorsolateralInferiorPrefrontalCortex", 2, true),
            new contact("GM/RostralDorsolateralInferiorPrefrontalCortex", 1, false),
            new contact("WM", 0, true),
        ]
    },
    {
        label: "B",
        contacts: [
            new contact("GM/Hippocampus", 1, false),
            new contact("GM/Hippocampus", 0, true),
            new contact("GM/Hippocampus", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("GM/CaudalMiddleTemporalCortex", 2, false),
            new contact("GM/CaudalMiddleTemporalCortex", 1, true),
            new contact("GM/CaudalMiddleTemporalCortex", 0, false),
            new contact("GM/CaudalMiddleTemporalCortex", 2, true),
            new contact("GM/CaudalMiddleTemporalCortex", 1, false),
        ]
    },
    {
        label: "B'",
        contacts: [
            new contact("GM/Hippocampus", 1, false),
            new contact("GM/Hippocampus", 0, true),
            new contact("GM/MedialInferiorTemporalCortex", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("GM/RostralMiddleTemporalCortex", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
        ]
    },
    {
        label: "GPH'",
        contacts: [
            new contact("GM/Hippocampus", 1, false),
            new contact("GM/Hippocampus", 0, true),
            new contact("GM/Hippocampus", 2, false),
            new contact("GM/Hippocampus", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("GM/CaudalMiddleTemporalCortex", 2, true),
            new contact("GM/CaudalMiddleTemporalCortex", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
        ]
    },
    {
        label: "I'",
        contacts: [
            new contact("GM/InsularCortex", 1, false),
            new contact("GM/InsularCortex", 0, true),
            new contact("GM/InsularCortex", 2, false),
            new contact("GM/InsularCortex", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("GM/CaudalDorsolateralPrefrontalCortex", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
        ]
    },
    {
        label: "H'",
        contacts: [
            new contact("GM/CaudalSuperiorTemporalCortex", 1, false),
            new contact("WM", 0, true),
            new contact("GM/CaudalSuperiorTemporalCortex", 2, false),
            new contact("GM/CaudalSuperiorTemporalCortex", 1, true),
            new contact("GM/CaudalSuperiorTemporalCortex", 0, false),
            new contact("WM", 2, true),
            new contact("GM/CaudalSuperiorTemporalCortex", 1, false),
            new contact("GM/CaudalSuperiorTemporalCortex", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
        ]
    },
    {
        label: "TI'",
        contacts: [
            new contact("GM/InsularCortex", 1, false),
            new contact("GM/InsularCortex", 0, true),
            new contact("WM", 2, false),
            new contact("GM/RostralSuperiorTemporalCortex", 1, true),
            new contact("GM/RostralSuperiorTemporalCortex", 0, false),
            new contact("WM", 2, true),
            new contact("GM/RostralSuperiorTemporalCortex", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
        ]
    },
    {
        label: "OT'",
        contacts: [
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("GM/LateralVisualCortex", 2, false),
            new contact("GM/LateralVisualCortex", 1, true),
            new contact("GM/LateralVisualCortex", 0, false),
            new contact("WM", 2, true),
            new contact("GM/CaudalMiddleTemporalCortex", 1, false),
            new contact("GM/CaudalMiddleTemporalCortex", 0, true),
            new contact("GM/CaudalMiddleTemporalCortex", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
        ]
    },
    {
        label: "PI'",
        contacts: [
            new contact("GM/PosteriorCingulateCortex", 1, false),
            new contact("GM/PosteriorCingulateCortex", 0, true),
            new contact("WM", 2, false),
            new contact("WM", 1, true),
            new contact("WM", 0, false),
            new contact("WM", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
            new contact("GM/CaudalMiddleTemporalCortex", 1, true),
            new contact("WM", 0, false),
            new contact("GM/VentralInferiorParietalCortex", 2, true),
            new contact("WM", 1, false),
            new contact("WM", 0, true),
            new contact("WM", 2, false),
        ]
    },
];
