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
            new contact("Loc3", 1, false),
            new contact("Loc1", 0, true),
            new contact("Loc2", 2, false),
            new contact("Loc4", 1, true),
            new contact("Loc5", 0, false),
            new contact("Loc2", 2, true),
            new contact("Loc3", 1, false),
            new contact("Loc1", 0, true),
            new contact("Loc4", 2, false),
            new contact("Loc5", 1, true),
            new contact("Loc2", 0, false),
            new contact("Loc3", 2, true),
            new contact("Loc1", 1, false),
        ]
    },
    {
        label: "TB'",
        contacts: [
            new contact("Loc6", 1, false),
            new contact("Loc7", 0, true),
            new contact("Loc8", 2, false),
            new contact("Loc9", 1, true),
            new contact("Loc0", 0, false),
            new contact("Loc6", 2, true),
            new contact("Loc7", 1, false),
            new contact("Loc8", 0, true),
            new contact("Loc9", 2, false),
            new contact("Loc0", 1, true),
            new contact("Loc6", 0, false),
        ]
    },
    {
        label: "TP'",
        contacts: [
            new contact("Loc4", 1, false),
            new contact("Loc5", 0, true),
            new contact("Loc6", 2, false),
            new contact("Loc7", 1, true),
            new contact("Loc8", 0, false),
            new contact("Loc9", 2, true),
            new contact("Loc0", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 2, false),
            new contact("Loc6", 1, true),
            new contact("Loc7", 0, false),
            new contact("Loc8", 2, true),
        ]
    },
    {
        label: "A'",
        contacts: [
            new contact("Loc7", 1, false),
            new contact("Loc8", 0, true),
            new contact("Loc9", 2, false),
            new contact("Loc0", 1, true),
            new contact("Loc1", 0, false),
            new contact("Loc2", 2, true),
            new contact("Loc3", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 2, false),
            new contact("Loc6", 1, true),
            new contact("Loc7", 0, false),
            new contact("Loc8", 2, true),
            new contact("Loc9", 1, false),
            new contact("Loc0", 0, true),
            new contact("Loc1", 2, false),
        ]
    },
    {
        label: "OR'",
        contacts: [
            new contact("Loc2", 1, false),
            new contact("Loc3", 0, true),
            new contact("Loc4", 2, false),
            new contact("Loc5", 1, true),
            new contact("Loc6", 0, false),
            new contact("Loc7", 2, true),
            new contact("Loc8", 1, false),
            new contact("Loc9", 0, true),
            new contact("Loc0", 2, false),
            new contact("Loc1", 1, true),
            new contact("Loc2", 0, false),
            new contact("Loc3", 2, true),
            new contact("Loc4", 1, false),
            new contact("Loc5", 0, true),
        ]
    },
    {
        label: "B",
        contacts: [
            new contact("Loc6", 1, false),
            new contact("Loc7", 0, true),
            new contact("Loc8", 2, false),
            new contact("Loc9", 1, true),
            new contact("Loc0", 0, false),
            new contact("Loc1", 2, true),
            new contact("Loc2", 1, false),
            new contact("Loc3", 0, true),
            new contact("Loc4", 2, false),
            new contact("Loc5", 1, true),
            new contact("Loc6", 0, false),
            new contact("Loc7", 2, true),
            new contact("Loc8", 1, false),
        ]
    },
    {
        label: "B'",
        contacts: [
            new contact("Loc9", 1, false),
            new contact("Loc0", 0, true),
            new contact("Loc1", 2, false),
            new contact("Loc2", 1, true),
            new contact("Loc3", 0, false),
            new contact("Loc4", 2, true),
            new contact("Loc5", 1, false),
            new contact("Loc6", 0, true),
            new contact("Loc7", 2, false),
            new contact("Loc8", 1, true),
            new contact("Loc9", 0, false),
            new contact("Loc0", 2, true),
            new contact("Loc1", 1, false),
            new contact("Loc2", 0, true),
        ]
    },
    {
        label: "GPH'",
        contacts: [
            new contact("Loc3", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 2, false),
            new contact("Loc6", 1, true),
            new contact("Loc7", 0, false),
            new contact("Loc8", 2, true),
            new contact("Loc9", 1, false),
            new contact("Loc0", 0, true),
            new contact("Loc1", 2, false),
            new contact("Loc2", 1, true),
            new contact("Loc3", 0, false),
            new contact("Loc4", 2, true),
            new contact("Loc5", 1, false),
            new contact("Loc6", 0, true),
            new contact("Loc7", 2, false),
        ]
    },
    {
        label: "I'",
        contacts: [
            new contact("Loc8", 1, false),
            new contact("Loc9", 0, true),
            new contact("Loc0", 2, false),
            new contact("Loc1", 1, true),
            new contact("Loc2", 0, false),
            new contact("Loc3", 2, true),
            new contact("Loc4", 1, false),
            new contact("Loc5", 0, true),
            new contact("Loc6", 2, false),
            new contact("Loc7", 1, true),
            new contact("Loc8", 0, false),
            new contact("Loc9", 2, true),
            new contact("Loc0", 1, false),
            new contact("Loc1", 0, true),
            new contact("Loc2", 2, false),
        ]
    },
    {
        label: "H'",
        contacts: [
            new contact("Loc3", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 2, false),
            new contact("Loc6", 1, true),
            new contact("Loc7", 0, false),
            new contact("Loc8", 2, true),
            new contact("Loc9", 1, false),
            new contact("Loc0", 0, true),
            new contact("Loc1", 2, false),
            new contact("Loc2", 1, true),
        ]
    },
    {
        label: "TI'",
        contacts: [
            new contact("Loc3", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 2, false),
            new contact("Loc6", 1, true),
            new contact("Loc7", 0, false),
            new contact("Loc8", 2, true),
            new contact("Loc9", 1, false),
            new contact("Loc0", 0, true),
            new contact("Loc1", 2, false),
            new contact("Loc2", 1, true),
        ]
    },
    {
        label: "OT'",
        contacts: [
            new contact("Loc3", 1, false),
            new contact("Loc4", 0, true),
            new contact("Loc5", 2, false),
            new contact("Loc6", 1, true),
            new contact("Loc7", 0, false),
            new contact("Loc8", 2, true),
            new contact("Loc9", 1, false),
            new contact("Loc0", 0, true),
            new contact("Loc1", 2, false),
            new contact("Loc2", 1, true),
            new contact("Loc3", 0, false),
            new contact("Loc4", 2, true),
            new contact("Loc5", 1, false),
            new contact("Loc6", 0, true),
            new contact("Loc7", 2, false),
            new contact("Loc8", 1, true),
            new contact("Loc9", 0, false),
        ]
    },
    {
        label: "PT'",
        contacts: [
            new contact("Loc0", 1, false),
            new contact("Loc1", 0, true),
            new contact("Loc2", 2, false),
            new contact("Loc3", 1, true),
            new contact("Loc4", 0, false),
            new contact("Loc5", 2, true),
            new contact("Loc6", 1, false),
            new contact("Loc7", 0, true),
            new contact("Loc8", 2, false),
            new contact("Loc9", 1, true),
            new contact("Loc0", 0, false),
            new contact("Loc1", 2, true),
            new contact("Loc2", 1, false),
            new contact("Loc3", 0, true),
            new contact("Loc4", 2, false),
        ]
    },
];
