//const fs = require('fs');
//var file = fs.readFileSync(__dirname + '\\runescape.csv', 'utf8');

var file = "runescapeQuests.csv";
var allQuests = [];

var playerCompleted = {};
var playerLevel = {};

const questInaxCol = {
    border: '#A11920',
    background: '#B31C24',
    highlight: {
        border: '#A11920',
        background: '#BA3239'
    },
    hover: {
        border: '#A11920',
        background: '#BA3239'
    }
}
const questCompCol = {
    border: '#19a11b',
    background: '#1cb31f',
    highlight: {
        border: '#19a11b',
        background: '#32ba35'
    },
    hover: {
        border: '#19a11b',
        background: '#32ba35'
    }
}

const questCanDoCol = {
    border: '#a17f19',
    background: '#b38e1c',
    highlight: {
        border: '#a17f19',
        background: '#ba9932'
    },
    hover: {
        border: '#a17f19',
        background: '#ba9932'
    }
}

class Quest {
    constructor(array){
        this.name = array[0];
        this.pageLink = array[1];

        array[2] = array[2].replace('"' , "");
        array[2] = array[2].replace('"' , "");
        this.preQuests = array[2].split("\n");

        array[3] = array[3].replace('"' , "");
        array[3] = array[3].replace('"' , "");
        this.levels = {}
        if(array[3] != undefined && array[3] != "") {
            var skills = array[3].split("\n");
            
            for(var i = 0; i < skills.length; i++) {
                var aSkill = skills[i].split(" ");
                this.levels[aSkill[1]] = aSkill[0];
            }
                
        }

        array[4] = array[4].replace('"' , "");
        array[4] = array[4].replace('"' , "");
        this.otherReq = array[4].split("\n");

        this.itemsrequired = array[5].split("\n");
    }
}

function recursiveTree(quest) {
    var ret = 0;
    if(allQuests[quest].preQuests[0] == 'null') return 1.5;
    for(var i = 0; i < allQuests[quest].preQuests.length; i++) {
        for(var j = 0; j < allQuests.length; j++) {
            if(allQuests[quest].preQuests[i] == allQuests[j].name) {
                ret += recursiveTree(j)*1.1;
                break;
            }
        }
    }
    return ret
}

function linkNodes(array){
    var nodeRef = array[1];
    var nodes = array[0];
    var allQuests = array[2];
    var links = [];
    num = 0;
    for(var i = 0; i < nodes.length; i++) {
        if(allQuests[nodes[i].id].preQuests[0] != 'null') {
            for(var j of allQuests[nodes[i].id].preQuests){
                links[num] = {from: nodeRef[j], to: nodes[i].id, arrows: 'to'};
                num++;
            }
        }
    }
    return links;
}




function setNodes(quests) {
    var nodeRef = {};
    var nodes = []
    for(var i = 0; i < quests.length; i++) {
        var val = 30 + recursiveTree(i);
        //decide for pop up text 
        if(quests[i].otherReq[0] == undefined || quests[i].otherReq[0] == "") {
            var reqVal = undefined;
        } else {
            var reqVal = "other requirements:<br>" + quests[i].otherReq.join("<br>");
        }
        
        if(playerCompleted[quests[i].name] == 1 ) {
            var col = questCompCol;
        } else {
            if(quests[i].levels == {}) {
                var col = questCanDoCol;
            } else {
                var col = questCanDoCol;
                for(var a in quests[i].levels){
                    if(playerLevel[a] < quests[i].levels[a]) {
                        var col = questInaxCol;
                        break;
                    }
                }
            }
            for(var j = 0; j < quests[i].preQuests.length; j++) {
                if(playerCompleted[quests[i].preQuests[j]] == 0) {
                    col = questInaxCol;
                    break;
                }
            }
        }

        if(reqVal != undefined) {
            nodes[i] = {
                font: {
                    color: "white"
                },
                id: i,
                label: quests[i].name,
                shape: "dot",
                title: reqVal,
                size: val,
                color: col,
                mass: 0.8
            };
        } else {
            nodes[i] = {
                font: {
                    color: "white"
                },
                id: i,
                label: quests[i].name,
                shape: "dot",
                size: val,
                color: col,
                mass: 0.8
            };
        }

        nodeRef[quests[i].name] = i;
    }
    return [nodes, nodeRef];
}


function setup(data) {
    var array = data;
    array = array.split("\r");
    var final = [];
    for(var i = 0; i < array.length; i++){
        array[i] = array[i].replace('\n', '');
        final[i] = array[i].split(',');
    }
    for(var i = 1; i < final.length; i++) {
        if(final[i][0] == '') break;
        allQuests[i-1] = new Quest(final[i]);
    }
    
    //setup("localhost/runescape/runescape.json");
    // create an array with nodes
    var arr = setNodes(allQuests)
    var nodes = new vis.DataSet(arr[0]);
    arr.push(allQuests)
    // create an array with edges
    var edges = new vis.DataSet(linkNodes(arr));

    // create a network
    var container = document.getElementById('network');
    var data = {
        nodes: nodes,
        edges: edges
    };
    
    var options = {
        "nodes": {
            "font": { "size": 32 },
            "shape": "dot"
        },
        "edges": {
            "arrows": { "from": { "enabled": true } },
            "color": { "inherit": true },
            "smooth": { "forceDirection": "none", "roundness": 1 },
            "width": 2
        },
        "physics": {
            "forceAtlas2Based": { "gravitationalConstant": -322, "springLength": 65, "avoidOverlap": 0.86 },
            "minVelocity": 0.75,
            "solver": "forceAtlas2Based",
        }
    };
    var network = new vis.Network(container, data, options);



    network.on("click", (data) => {
        //create a new rig based on the quest
        var arrayOfSubQuests = getSubQuest(data.nodes[0]);

        var questArray = [];
        for(var a of arrayOfSubQuests) {
            var isIn = false
            for(var i = 0; i < questArray.length; i ++) {
                if(questArray[i].name == allQuests[a].name) { isIn = true; break; }
            }
            if(!isIn) questArray.push(allQuests[a]);
        }

        var array = setNodes(questArray);

        array.push(questArray);

        var subNodesfinal = new vis.DataSet(array[0]);
        var subEdges = new vis.DataSet(linkNodes(array));

        var container2 = document.getElementById('networkSub');
        var subdata = {
            nodes: subNodesfinal,
            edges: subEdges
        };

        var network2 = new vis.Network(container2, subdata, options);


    });

}

function getSubQuest(quest) {
    if(allQuests[quest].preQuests[0] == 'null') return [quest];

    var arrayToReturn = [];
    for(var i = 0; i < allQuests[quest].preQuests.length; i++) {
        for(var j = 0; j < allQuests.length; j++) {
            if(allQuests[j].name == allQuests[quest].preQuests[i]) {
                arrayToReturn = arrayToReturn.concat(getSubQuest(j));
                break;
            }
        }
    }
    arrayToReturn.push(quest);
    return arrayToReturn;
}



function insertPlayerData(data) {
    var array = data.split("\r");
    for (var i = 1; i < array.length; i++) {
        array[i] = array[i].split(",");
    }
    for(var i = 1; i < array.length; i++){
        playerCompleted[array[i][0].replace("\n", "")] = array[i][1];
    }
}

function insertPlayerLevels(data){
    var array = data.split("\n");
    for (var i = 1; i < array.length; i++) {
        array[i] = array[i].split(",");
    }
    for(var i = 1; i < array.length; i++){
        playerLevel[array[i][0].replace("\n", "")] = array[i][1];
    }
}