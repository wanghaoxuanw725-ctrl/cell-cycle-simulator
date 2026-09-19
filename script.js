// =====================================================
// 1. 找到 SVG
// =====================================================

const svg = document.getElementById("cellCycle");


// =====================================================
// 2. 圆环参数
// =====================================================

const centerX = 250;
const centerY = 250;

const radius = 180;

// 轨道线宽；细胞会在此宽度内随机散布
const trackWidth = 64;
const cellSize = 3.5;
const maxRadialOffset = trackWidth / 2 - cellSize - 2;


// =====================================================
// 3. 细胞数量
// =====================================================

const cellCount = 100;

const cells = [];


// =====================================================
// 4. 模拟状态
// =====================================================

// 是否正在运行
let running = true;

// 模拟速度
let simulationSpeed = 1;

// 是否加入了胸腺嘧啶
let drugPresent = false;


// =====================================================
// 5. 圆周参数
// =====================================================

const TWO_PI = Math.PI * 2;


// =====================================================
// 6. 细胞周期阶段
// =====================================================

const phases = [

    {
        name: "G1",
        start: 0.00,
        end: 0.45,
        color: "#4CAF50",
        trackColor: "#C8E6C9"
    },

    {
        name: "S",
        start: 0.45,
        end: 0.75,
        color: "#2196F3",
        trackColor: "#BBDEFB"
    },

    {
        name: "G2",
        start: 0.75,
        end: 0.90,
        color: "#FFC107",
        trackColor: "#FFE082"
    },

    {
        name: "M",
        start: 0.90,
        end: 1.00,
        color: "#F44336",
        trackColor: "#FFCDD2"
    }

];


// =====================================================
// 7. 绘制四个阶段的圆弧
// =====================================================

const circumference = TWO_PI * radius;


for (const phase of phases) {

    const arc = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
    );

    arc.setAttribute("cx", centerX);
    arc.setAttribute("cy", centerY);
    arc.setAttribute("r", radius);

    arc.setAttribute("fill", "none");

    arc.setAttribute("stroke", phase.trackColor);

    arc.setAttribute("stroke-width", trackWidth);


    const phaseLength =
        (phase.end - phase.start) *
        circumference;


    arc.setAttribute(
        "stroke-dasharray",
        `${phaseLength} ${circumference}`
    );


    arc.setAttribute(
        "stroke-dashoffset",
        -phase.start * circumference
    );


    // 从顶部开始
    arc.setAttribute(
        "transform",
        "rotate(-90 250 250)"
    );


    svg.insertBefore(
        arc,
        svg.firstChild
    );
}


// =====================================================
// 8. 把 angle 转换成周期中的位置
// =====================================================
//
// 你之前找到的这个 + π/2 非常重要：
//
// angle + π/2
//
// 它把“数学坐标的 0° 在右边”
// 转换成“周期从顶部开始”。
//
// 所以这里保留你的修改。
// =====================================================

function getCyclePosition(angle) {

    let position =
        (angle + Math.PI / 2) % TWO_PI;


    if (position < 0) {
        position += TWO_PI;
    }


    // 转换成 0 ~ 1
    return position / TWO_PI;
}


// =====================================================
// 9. 根据位置判断细胞阶段
// =====================================================

function getPhase(angle) {

    const position =
        getCyclePosition(angle);


    for (const phase of phases) {

        if (
            position >= phase.start &&
            position < phase.end
        ) {
            return phase;
        }

    }


    return phases[0];
}


// =====================================================
// 10. G1/S 阻断位置
// =====================================================

// S 期的开始位置
const blockPosition = phases.find(
    phase => phase.name === "S"
).start;


// 为了让细胞有机会被检测到，
// 我们设置一个很窄的“阻断区域”



// =====================================================
// 11. 计算阻断位置对应的 angle
// =====================================================

const blockAngle =
    blockPosition * TWO_PI -
    Math.PI / 2;


// =====================================================
// 12. 创建细胞
// =====================================================

for (let i = 0; i < cellCount; i++) {

    const cell = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
    );


    cell.setAttribute("r", cellSize);

    cell.setAttribute(
        "class",
        "cell"
    );


    // 随机初始位置
    const angle =
        Math.random() * TWO_PI;

    // 在轨道宽度内随机径向偏移，同步后不会叠成一个点
    const radialOffset =
        (Math.random() * 2 - 1) *
        maxRadialOffset;

    // 每个细胞速度略有差异：基础 0.003 的 ±10%
    const speed =
        0.003 *
        (0.96 + Math.random() * 0.08);


    cells.push({

        // SVG 元素
        element: cell,

        // 当前角度
        angle: angle,

        // 最初角度
        initialAngle: angle,

        // 当前速度
        speed: speed,

        // 初始速度
        initialSpeed: speed,

        // 相对轨道中线的径向偏移
        radialOffset: radialOffset,

        // 是否已经被阻断
        blocked: false

    });


    svg.appendChild(cell);
}


// =====================================================
// 13. 动画
// =====================================================

function animate() {


    // 统计各阶段细胞数

    const counts = {

        G1: 0,
        S: 0,
        G2: 0,
        M: 0

    };


    // =================================================
    // 遍历细胞
    // =================================================

    for (const cell of cells) {

        // =================================================
        // 1. 先检查：加入药物时，这个细胞是否已经在 S 期
        // =================================================
    
        const currentPosition =
            getCyclePosition(cell.angle);
    
        const sPhase = phases.find(
            phase => phase.name === "S"
        );
    
    
        if (
            drugPresent &&
            !cell.blocked &&
            currentPosition >= sPhase.start &&
            currentPosition < sPhase.end
        ) {
    
            // 已经在 S 期的细胞：
            // 原地停止
            cell.blocked = true;
        }
    
    
        // =================================================
        // 2. 没有被阻断，并且实验正在运行
        // =================================================
    
        if (
            running &&
            !cell.blocked
        ) {
    
            // 细胞继续向前（各自速度 × 全局模拟倍速）
            cell.angle +=
                cell.speed *
                simulationSpeed;
    
    
            // ---------------------------------------------
            // 检查移动之后是否进入 S 期
            // ---------------------------------------------
    
            const newPosition =
                getCyclePosition(cell.angle);
    
    
            if (
                drugPresent &&
                newPosition >= sPhase.start &&
                newPosition < sPhase.end
            ) {
    
                // 如果是从其他阶段进入 S 期，
                // 就把它停在 G1/S 边界
    
                cell.angle =
                    blockAngle;
    
                cell.blocked = true;
            }
    
        }
    
    
        // =================================================
        // 3. 如果药物已经去除
        // =================================================
    
        if (!drugPresent) {
    
            // 解开阻断
            cell.blocked = false;
    
        }
    
    
        // =================================================
        // 4. 判断细胞目前处于哪个阶段
        // =================================================
    
        const phase =
            getPhase(cell.angle);
    
    
        // 统计
        counts[phase.name]++;
    
    
        // =================================================
        // 5. 根据角度 + 径向偏移计算位置
        // =================================================
    
        const cellRadius =
            radius + cell.radialOffset;

        const x =
            centerX +
            cellRadius *
            Math.cos(cell.angle);
    
        const y =
            centerY +
            cellRadius *
            Math.sin(cell.angle);
    
    
        // =================================================
        // 6. 更新 SVG
        // =================================================
    
        cell.element.setAttribute(
            "cx",
            x
        );
    
        cell.element.setAttribute(
            "cy",
            y
        );
    
    
        // =================================================
        // 7. 根据阶段改变颜色
        // =================================================
    
        cell.element.style.fill =
            phase.color;
    
    }


    // =================================================
    // 更新统计数字
    // =================================================

    document.getElementById(
        "countG1"
    ).textContent = counts.G1;


    document.getElementById(
        "countS"
    ).textContent = counts.S;


    document.getElementById(
        "countG2"
    ).textContent = counts.G2;


    document.getElementById(
        "countM"
    ).textContent = counts.M;


    // =================================================
    // 继续下一帧
    // =================================================

    requestAnimationFrame(animate);

}


// =====================================================
// 14. 暂停 / 继续
// =====================================================

const pauseButton =
    document.getElementById(
        "pauseButton"
    );


const statusText =
    document.getElementById(
        "statusText"
    );


pauseButton.addEventListener(
    "click",
    function () {

        running = !running;


        if (running) {

            pauseButton.textContent =
                "⏸ 暂停";

            statusText.textContent =
                "运行中";

        }

        else {

            pauseButton.textContent =
                "▶ 继续";

            statusText.textContent =
                "已暂停";

        }

    }
);


// =====================================================
// 15. 速度控制
// =====================================================

const speedSlider =
    document.getElementById(
        "speedSlider"
    );


speedSlider.addEventListener(
    "input",
    function () {

        simulationSpeed =
            Number(
                speedSlider.value
            );

    }
);


// =====================================================
// 16. 重置
// =====================================================

const resetButton =
    document.getElementById(
        "resetButton"
    );


resetButton.addEventListener(
    "click",
    function () {


        for (const cell of cells) {

            cell.angle =
                cell.initialAngle;

            cell.speed =
                cell.initialSpeed;

            cell.blocked =
                false;

        }


        running = true;

        simulationSpeed = 1;

        drugPresent = false;


        pauseButton.textContent =
            "⏸ 暂停";


        statusText.textContent =
            "运行中";


        speedSlider.value = 1;


        document.getElementById(
            "drugStatus"
        ).textContent =
            "未加入";


        document.getElementById(
            "experimentStatus"
        ).textContent =
            "正常周期";

    }
);


// =====================================================
// 17. 加入胸腺嘧啶
// =====================================================

const addDrugButton =
    document.getElementById(
        "addDrugButton"
    );


const drugStatus =
    document.getElementById(
        "drugStatus"
    );


const experimentStatus =
    document.getElementById(
        "experimentStatus"
    );


addDrugButton.addEventListener(
    "click",
    function () {

        drugPresent = true;


        drugStatus.textContent =
            "已加入";


        experimentStatus.textContent =
            "G1/S 阻断中";

    }
);


// =====================================================
// 18. 去除胸腺嘧啶
// =====================================================

const removeDrugButton =
    document.getElementById(
        "removeDrugButton"
    );


removeDrugButton.addEventListener(
    "click",
    function () {

        drugPresent = false;


        // 所有已经被阻断的细胞解除阻断
        for (const cell of cells) {

            cell.blocked = false;

        }


        drugStatus.textContent =
            "未加入";


        experimentStatus.textContent =
            "阻断释放";

    }
);


// =====================================================
// 19. 开始动画
// =====================================================

animate();