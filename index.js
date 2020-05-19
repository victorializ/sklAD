let stopped = true;
let defaultBehaviorIsActive = false;

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
                this.dockedProducing.behavior.proceed();
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
                    this.dockedConsuming.behavior.proceed();
                    this.dockedConsuming = null;
                    this.score = 0;
                }
            }
        }

        this.updateVisual();
    }

    updateVisual() {
        if (this.score >= PaintingCycleTime) {
            this.element.src = "assets/painter_table_with_painted_box.png"
        }
        else if (this.score >= Math.round(PaintingCycleTime / 2)) {
            this.element.src = "assets/painter_table_with_painted_box.png"
        }
        else if (this.state === ConveyorState.empty) {
            this.element.src = "assets/painter_table_empty.png"
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
            if(this.element.id === "conveyor-1") {
                this.element.src = "assets/lentochnyh-konveyer_notpainted_2.png";
            } else if (this.element.id === "conveyor-2") {
                this.element.src = "assets/lentochnyh-konveyer_painted_box_2_1.png";
            }
        }

        if (this.state === ConveyorState.empty) {
            if(this.element.id === "conveyor-1") {
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
                this.dockedRobot.behavior.proceed();
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
            if(this.element.id === "conveyor-1") {
                this.element.src = "assets/lentochnyh-konveyer_notpainted_2.png";
            } else if (this.element.id === "conveyor-2") {
                this.element.src = "assets/lentochnyh-konveyer_painted_box_2_1.png";
            }
        }

        if (this.state === ConveyorState.empty) {
            if(this.element.id === "conveyor-1") {
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
                this.dockedRobot.behavior.proceed();
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

    update() {
        this.behavior.performUpdate(this);
    }
}

class MoveToTargetBehavior {
    constructor(target) {
        this.target = target;
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
    robot2.setBehavior(new MoveToTargetBehavior(stand()));
    robot3.setBehavior(new MoveBetweenTargetsBehavior(paintingStation, consumingConveyor));

    defaultBehaviorIsActive = true;
}

function fireEvent() {
    robot1.setBehavior(new MoveToTargetBehavior(zone()));
    robot2.setBehavior(new MoveToTargetBehavior(zone()));
    robot3.setBehavior(new MoveToTargetBehavior(zone()));

    defaultBehaviorIsActive = false;
}

function startEvent() {
    if (stopped) {
        stopped = false;
    } else if (!defaultBehaviorIsActive) {
        setDefaultBehavior();
    }
}

function paintsEvent() {
    if (defaultBehaviorIsActive) {
        stopped = true;
    }
}

function humanEvent() {
    if (defaultBehaviorIsActive) {
        stopped = true;
    }
}

async function main() {
    document.getElementById("fire").onclick = fireEvent;
    document.getElementById("start").onclick = startEvent;
    document.getElementById("paints").onclick = paintsEvent;
    document.getElementById("human").onclick = humanEvent;

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

                    producingConveyor.update();
                    consumingConveyor.update();

                    paintingStation.update();
                }
            }, fixedTimeStep);
        });
    }
}

window.onload = main;