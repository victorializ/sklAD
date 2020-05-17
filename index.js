let stopped = false; 

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
    const centerY = layout.top + layoutHeight/2;
    const centerX = layout.left + layoutWidth/2;
    setPosition(conveyor(1), layout.left - 30, centerY);
    setPosition(conveyor(2), layout.right - conveyor(2).getBoundingClientRect().width + 30, centerY);
    setPosition(stand(), centerX - stand().getBoundingClientRect().width / 2, layout.top + 50);
    setPosition(zone(), centerX - zone().getBoundingClientRect().width / 2, 
        layout.bottom - zone().getBoundingClientRect().height - 10);
}

function moveRobot(robot, target) {
    let left = Math.round(robot.getBoundingClientRect().left);
    let top = Math.round(robot.getBoundingClientRect().top);
    const leftTarget = Math.round(target.getBoundingClientRect().left);
    const topTarget = Math.round(target.getBoundingClientRect().top - 
        robot.getBoundingClientRect().height - 5);

    return new Promise(resolve => {
        const interval = setInterval(() => {
            if(stopped) {
                resolve();
            } else if(left === leftTarget && top === topTarget) {
                clearInterval(interval);
                resolve();
            } else {
                left < leftTarget && left++; 
                left > leftTarget && left--;
                top < topTarget && top++;
                top > topTarget && top --;
                setPosition(robot, left, top);
            }
        }, 5);
    });
}

async function main() {
    setInitalPositions();
    await moveRobot(robot(1), conveyor(1));
    await moveRobot(robot(2), stand());
    await moveRobot(robot(3), conveyor(2));

    while(!stopped) {
        await moveRobot(robot(3), stand());
        await moveRobot(robot(3), conveyor(2));
        await moveRobot(robot(2), stand());
        await new Promise(resolve => setTimeout(resolve, 400));
        await moveRobot(robot(1), stand());
        await moveRobot(robot(1), conveyor(1));
    }
}

window.onload = main;