let stopped = true;
let fire = false;
let defaultBehaviorIsActive = false;

let log = "";

const ConveyorState = Object.freeze({ "empty": 1, "filled": 2 });
const RobotState = Object.freeze({ "empty": 1, "carrying": 2 });
const RobotRole = Object.freeze({ "consuming": 1, "producing": 2, "invalid": 3 });

const ConveyorCycleTime = 2500; // time in milliseconds
const PaintingCycleTime = 2000; // time in milliseconds
const fixedTimeStep = 10; // time in milliseconds

let robot1;
let robot2;
let robot3;

let producingConveyor;
let consumingConveyor;

let paintingStation;

const robot = number => document.getElementById(`robot-${number}`);
const conveyor = number => document.getElementById(`conveyor-${number}`);
const stand = () => document.getElementById('stand');
const zone = () => document.getElementById('zone');

function setPosition(element, left, top) {
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;
}

function setInitalPositions() {
    const layoutHeight = 450;
    const layoutWidth = 400;
    const layout = document.getElementById('layout').getBoundingClientRect();
    const centerY = layout.top + layoutHeight / 2;
    const centerX = layout.left + layoutWidth / 2;
    setPosition(conveyor(1), layout.left - 30, centerY);
    setPosition(conveyor(2), layout.right - conveyor(2).getBoundingClientRect().width + 30, centerY);
    setPosition(stand(), centerX - stand().getBoundingClientRect().width / 2, layout.top + 50);
    setPosition(zone(), centerX - zone().getBoundingClientRect().width / 2,
        layout.bottom - zone().getBoundingClientRect().height - 10);
    setPosition(robot(1), centerX - zone().getBoundingClientRect().width / 2 - robot(1).getBoundingClientRect().width * 2,
        layout.bottom - zone().getBoundingClientRect().height - 10);
    setPosition(robot(2), centerX - zone().getBoundingClientRect().width / 2,
        layout.bottom - zone().getBoundingClientRect().height - 10);
    setPosition(robot(3), centerX - zone().getBoundingClientRect().width / 2 + robot(3).getBoundingClientRect().width * 2,
        layout.bottom - zone().getBoundingClientRect().height - 10);
}

class PaintingStation {
    constructor(element) {
        this.element = element;
        this.state = ConveyorState.empty;
        this.dockedConsuming = null;
        this.dockedProducing = null;
        this.score = 0;
    }

    update() {
        if (this.state == ConveyorState.empty) {
            if (this.dockedProducing != null) {
                console.log("docked producing");
                this.state = ConveyorState.filled;
                this.dockedProducing.state = RobotState.empty;
                this.dockedProducing?.updateVisual();
                this.dockedProducing.behavior.proceed();
                addLogRecord(this.dockedProducing.element.id + ": started moving to " + this.dockedProducing.behavior.targetFirst.element.id);
                this.dockedProducing = null;
            }
        }

        if (this.state == ConveyorState.filled) {
            if (this.score < PaintingCycleTime) {
                this.score += fixedTimeStep;
            }

            if (this.score >= PaintingCycleTime) {
                if (this.dockedConsuming != null) {
                    console.log("docked consuming");
                    this.state = ConveyorState.empty;
                    this.dockedConsuming.state = RobotState.filled;
                    this.dockedConsuming?.updateVisual();
                    this.dockedConsuming.behavior.proceed();
                    addLogRecord(this.dockedConsuming.element.id + ": started moving to " + this.dockedConsuming.behavior.targetFirst.element.id);
                    this.dockedConsuming = null;
                    this.score = 0;
                }
            }
        }

        this.updateVisual();
    }

    updateVisual() {
        if (this.score >= Math.round(PaintingCycleTime * 0.9)) {
            this.element.src = "assets/painter_table_with_painted_box.png"
        }
        else if (this.score >= Math.round(PaintingCycleTime / 2)) {
            this.element.src = "assets/painter_table_half_painted.png"
        }
        else if (this.state === ConveyorState.empty) {
            this.element.src = "assets/painter_table_empty.png"
        }
        else {
            this.element.src = "assets/painter_table_with_not_painted_box.png"
        }
    }

    onReachedTarget(robot) {
        if (robot.role === RobotRole.producing) {
            console.log("producing");
            this.dockedProducing = robot;
        }

        if (robot.role === RobotRole.consuming) {
            console.log("consuming");
            this.dockedConsuming = robot;
        }

        console.log(robot);
    }
}

class ProducingConveyor {
    constructor(element, state) {
        this.element = element;
        this.state = state;
        this.dockedRobot = null;
        this.score = 0;
    }

    onReachedTarget(robot) {
        this.dockedRobot = robot;
    }

    updateVisual() {
        if (this.state === ConveyorState.filled) {
            if (this.element.id === "conveyor-1") {
                this.element.src = "assets/lentochnyh-konveyer_notpainted_2.png";
            } else if (this.element.id === "conveyor-2") {
                this.element.src = "assets/lentochnyh-konveyer_painted_box_2_1.png";
            }
        }

        if (this.state === ConveyorState.empty) {
            if (this.element.id === "conveyor-1") {
                this.element.src = "assets/lentochnyh-konveyer_1_empty.png";
            } else if (this.element.id === "conveyor-2") {
                this.element.src = "assets/lentochnyh-konveyer_2_empty.png";
            }
        }
    }

    update() {
        if (this.state === ConveyorState.empty) {
            this.score += fixedTimeStep;
            if (this.score >= ConveyorCycleTime) {
                this.state = ConveyorState.filled;
                this.score = 0;
            }
        }

        if (this.state === ConveyorState.filled) {
            if (this.dockedRobot !== null) {
                this.dockedRobot.state = RobotState.filled;
                this.dockedRobot?.updateVisual();
                this.dockedRobot.behavior.proceed();
                addLogRecord(this.dockedRobot.element.id + ": started moving to " + this.dockedRobot.behavior.targetFirst.element.id);
                this.dockedRobot = null;
                this.state = ConveyorState.empty;
            }
        }

        this.updateVisual();
    }
}

class ConsumingConveyor {
    constructor(element, state) {
        this.element = element;
        this.state = state;
        this.dockedRobot = null;
        this.score = 0;
    }

    onReachedTarget(robot) {
        this.dockedRobot = robot;
    }

    updateVisual() {
        if (this.state === ConveyorState.filled) {
            if (this.element.id === "conveyor-1") {
                this.element.src = "assets/lentochnyh-konveyer_notpainted_2.png";
            } else if (this.element.id === "conveyor-2") {
                this.element.src = "assets/lentochnyh-konveyer_painted_box_2_1.png";
            }
        }

        if (this.state === ConveyorState.empty) {
            if (this.element.id === "conveyor-1") {
                this.element.src = "assets/lentochnyh-konveyer_1_empty.png";
            } else if (this.element.id === "conveyor-2") {
                this.element.src = "assets/lentochnyh-konveyer_2_empty.png";
            }
        }
    }

    update() {
        if (this.state === ConveyorState.filled) {
            this.score += fixedTimeStep;
            if (this.score >= ConveyorCycleTime) {
                this.state = ConveyorState.empty;
                this.score = 0;
            }
        }

        if (this.state === ConveyorState.empty) {
            if (this.dockedRobot !== null) {
                this.dockedRobot.state = RobotState.empty;
                this.dockedRobot?.updateVisual();
                this.dockedRobot.behavior.proceed();
                addLogRecord(this.dockedRobot.element.id + ": started moving to " + this.dockedRobot.behavior.targetFirst.element.id);
                this.dockedRobot = null;
                this.state = ConveyorState.filled;
            }
        }

        this.updateVisual();
    }
}

class Robot {
    constructor(element, role = RobotRole.invalid) {
        this.element = element;
        this.role = role;
        this.state = RobotState.empty;
    }

    setBehavior(behavior) {
        this.behavior = behavior;
    }

    updateVisual() {
        if (this.state === RobotState.empty) {
            if (this.element.id === "robot-1") {
                this.element.src = "assets/robot-1.png"
            } else {
                this.element.src = "assets/robot-1_left.png"
            }
        } else {
            if (this.element.id === "robot-1") {
                this.element.src = "assets/robot-1_with_box_right.png"
            } else {
                this.element.src = "assets/robot-1_with_painted_box.png"
            }
        }
    }

    update() {
        this.behavior.performUpdate(this);
    }
}

class MoveToTargetBehavior {
    constructor(target) {
        this.target = target;
        this.targetReached = false;
    }

    performUpdate(robot) {
        let left = Math.round(robot.element.getBoundingClientRect().left);
        let top = Math.round(robot.element.getBoundingClientRect().top);
        let leftTarget = Math.round(this.target.getBoundingClientRect().left);
        let topTarget = Math.round(this.target.getBoundingClientRect().top -
            robot.element.getBoundingClientRect().height - 5);
        if (left !== leftTarget || top !== topTarget) {
            left < leftTarget && left++;
            left > leftTarget && left--;
            top < topTarget && top++;
            top > topTarget && top--;
            setPosition(robot.element, left, top);
        }
        else if (this.targetReached === false) {
            this.targetReached = true;
            addLogRecord(robot.element.id + ": reached " + robot.behavior.target.id);
            this.targetFirst.onReachedTarget(robot);
        }
    }

    proceed() { }
}

class MoveBetweenTargetsBehavior {
    constructor(targetFirst, targetSecond) {
        this.targetFirst = targetFirst;
        this.targetSecond = targetSecond;
        this.targetReached = false;
    }

    performUpdate(robot) {
        let left = Math.round(robot.element.getBoundingClientRect().left);
        let top = Math.round(robot.element.getBoundingClientRect().top);
        let leftTarget = Math.round(this.targetFirst.element.getBoundingClientRect().left);
        let topTarget = Math.round(this.targetFirst.element.getBoundingClientRect().top -
            robot.element.getBoundingClientRect().height - 5);
        if (left !== leftTarget || top !== topTarget) {
            left < leftTarget && left++;
            left > leftTarget && left--;
            top < topTarget && top++;
            top > topTarget && top--;
            setPosition(robot.element, left, top);
        }
        else if (this.targetReached === false) {
            this.targetReached = true;
            addLogRecord(robot.element.id + ": reached " + robot.behavior.targetFirst.element.id);
            this.targetFirst.onReachedTarget(robot);
        }
    }

    proceed() {
        console.log("proceed");
        [this.targetFirst, this.targetSecond] = [this.targetSecond, this.targetFirst];
        this.targetReached = false;
    }
}

function setDefaultBehavior() {

    robot1.setBehavior(new MoveBetweenTargetsBehavior(producingConveyor, paintingStation));
    addLogRecord(robot1.element.id + ": started moving to " + robot1.behavior.targetFirst.element.id);
    robot2.setBehavior(new MoveToTargetBehavior(stand()));
    addLogRecord(robot2.element.id + ": started moving to " + robot2.behavior.target.id);
    robot3.setBehavior(new MoveBetweenTargetsBehavior(paintingStation, consumingConveyor));
    addLogRecord(robot3.element.id + ": started moving to " + robot3.behavior.targetFirst.element.id);

    defaultBehaviorIsActive = true;
}

function fireEvent() {
    stopped = false;

    robot1.setBehavior(new MoveToTargetBehavior(zone()));
    addLogRecord(robot1.element.id + ": started moving to " + robot1.behavior.target.id);
    robot2.setBehavior(new MoveToTargetBehavior(zone()));
    addLogRecord(robot2.element.id + ": started moving to " + robot2.behavior.target.id);
    robot3.setBehavior(new MoveToTargetBehavior(zone()));
    addLogRecord(robot3.element.id + ": started moving to " + robot3.behavior.target.id);

    robot1.state = RobotState.empty;
    robot1.updateVisual();
    robot3.state = RobotState.empty;
    robot3.updateVisual();

    producingConveyor.dockedRobot = null;
    consumingConveyor.dockedRobot = null;
    paintingStation.dockedConsuming = null;
    paintingStation.dockedProducing = null;

    defaultBehaviorIsActive = false;
    fire = true;

    addLogRecord("System: fire event started. All robots now proceed to safe zone and await start command.");
}

function startEvent() {
    if (stopped) {
        stopped = false;
    }
    if (fire) {
        setDefaultBehavior();
        fire = false;
    }

    addLogRecord("System: default behaviour started");
}

function paintsEvent() {
    if (defaultBehaviorIsActive) {
        stopped = true;
    }

    addLogRecord("System: not enought paint event started. All robots await start command.");
}

function humanEvent() {
    if (defaultBehaviorIsActive) {
        stopped = true;
    }

    addLogRecord("System: human event started. All robots await start command.");
}

function getFormattedDate() {
    var d = new Date();

    d = "[" + d.getFullYear() + "-" + ('0' + (d.getMonth() + 1)).slice(-2) + "-" + ('0' + d.getDate()).slice(-2) + " " + ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2) + "] ";

    return d;
}

function addLogRecord(text) {
    text = getFormattedDate() + text;
    log += text;
    log += "\n";
}

function download() {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(log));
    element.setAttribute('download', "log.txt");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

async function main() {
    document.getElementById("fire").onclick = fireEvent;
    document.getElementById("start").onclick = startEvent;
    document.getElementById("paints").onclick = paintsEvent;
    document.getElementById("human").onclick = humanEvent;
    document.getElementById("logfile").onclick = download;

    setInitalPositions();

    robot1 = new Robot(robot(1), RobotRole.producing);
    robot2 = new Robot(robot(2));
    robot3 = new Robot(robot(3), RobotRole.consuming);

    producingConveyor = new ProducingConveyor(conveyor(1), ConveyorState.filled);
    consumingConveyor = new ConsumingConveyor(conveyor(2), ConveyorState.empty);

    paintingStation = new PaintingStation(stand());

    setDefaultBehavior();

    while (true) {
        return new Promise(resolve => {
            const interval = setInterval(() => {
                if (!stopped) {
                    robot1.update();
                    robot2.update();
                    robot3.update();

                    if (!fire) {
                        producingConveyor.update();
                        consumingConveyor.update();

                        paintingStation.update();
                    }
                }
            }, fixedTimeStep);
        });
    }
}

window.onload = main;