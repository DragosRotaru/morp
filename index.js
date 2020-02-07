let mouseX;
let mouseY;
let mouseSensitivity = 1;

const sqr = x => x * x;
const distance = (a, b) => Math.sqrt(sqr(a) + sqr(b));
const thetaA = (canvas, tile) =>
  (distance(tile.x - mouseX, tile.y - mouseY) /
    distance(canvas.width, canvas.height)) *
  mouseSensitivity *
  (Math.PI / 2);
const thetaB = (canvas, tile) => mouseSensitivity * (Math.PI / 2);
const theta = thetaA;

const drawLine = (ctx, x1, y1, x2, y2) => {
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
};

const draw = (ctx, canvas, grid, radius) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();

  // Drawing the points for easy debugging
  /* for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const element = grid[i][j];
      ctx.fillStyle = `rgb(
        ${Math.floor(255 - (255 / grid.length) * i)},
        ${Math.floor(255 - (255 / grid[i].length) * j)},
        0)`;
      ctx.fillRect(element.x - 4, element.y - 4, 8, 8);
      for (let k = 0; k < element.corners.length; k++) {
        const corner = element.corners[k];
        ctx.fillRect(corner.x - 3, corner.y - 3, 6, 6);
      }
    }
  } */
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      drawTile(ctx, canvas, grid, grid[i][j], radius);
    }
  }
};

const drawTile = (ctx, canvas, grid, tile, radius) => {
  const A = Math.PI / 4; // spoke angle for octogon
  const S = (2 * radius * Math.sin(A / 2)) / Math.cos(A / 2);
  const ScosA = (S / 2) * Math.cos(A / 2);
  const C = 2 * radius * (1 - Math.cos(Math.PI / 4));

  const t = theta(canvas, tile);
  const r = ScosA / Math.cos(A / 2 + Math.PI / 2 + t);
  for (let k = 0; k < tile.corners.length; k++) {
    const corner = tile.corners[k];
    drawCorner(C, ctx, canvas, grid, corner, t, r, k);
  }
};

const drawCorner = (C, ctx, canvas, grid, corner, t, r, k) => {
  // Line
  const x2 = corner.x + r * Math.cos(corner.rotation - t);
  const y2 = corner.y + r * Math.sin(corner.rotation - t);
  drawLine(ctx, corner.x, corner.y, x2, y2);

  // Line
  const x3 = corner.x + r * Math.cos(corner.rotation + t);
  const y3 = corner.y + r * Math.sin(corner.rotation + t);
  drawLine(ctx, corner.x, corner.y, x3, y3);

  meet(ctx, C, canvas, grid, corner, t, k);
};

/**
 *
 * connecting the corners to the corners of adjacent tiles
 */
const meet = (ctx, C, canvas, grid, corner, t, k) => {
  // TODO if (!grid[i2] || !grid[i2][j2]) return;

  let tileRight, tileDown, tileLeft, tileUp;
  switch (k) {
    case 1:
      try {
        tileRight = grid[corner.i + 1][corner.j];
        meetWith(ctx, C, canvas, tileRight, corner, t, k, 3);
      } catch (error) {}
      try {
        tileDown = grid[corner.i][corner.j + 1];
        meetWith(ctx, C, canvas, tileDown, corner, t, k, 7);
      } catch (error) {}
      break;
    case 3:
      try {
        tileDown = grid[corner.i][corner.j + 1];
        meetWith(ctx, C, canvas, tileDown, corner, t, k, 5);
      } catch (error) {}
      try {
        tileLeft = grid[corner.i - 1][corner.j];
        meetWith(ctx, C, canvas, tileLeft, corner, t, k, 1);
      } catch (error) {}
      break;
    case 5:
      try {
        tileLeft = grid[corner.i - 1][corner.j];
        meetWith(ctx, C, canvas, tileLeft, corner, t, k, 7);
      } catch (error) {}
      try {
        tileUp = grid[corner.i][corner.j - 1];
        meetWith(ctx, C, canvas, tileUp, corner, t, k, 3);
      } catch (error) {}
      break;
    case 7:
      try {
        tileUp = grid[corner.i][corner.j - 1];
        meetWith(ctx, C, canvas, tileUp, corner, t, k, 1);
      } catch (error) {}
      try {
        tileRight = grid[corner.i + 1][corner.j];
        meetWith(ctx, C, canvas, tileRight, corner, t, k, 5);
      } catch (error) {}
      break;
    default:
      return;
  }
};

/**
 *
 * connecting a given corner to the adjacent tile
 */
const meetWith = (ctx, C, canvas, tile, corner, t, k, k2) => {
  const p = theta(canvas, tile);
  const a = Math.PI / 4 - t;
  const b = Math.PI / 4 - p;
  const c = Math.PI - a - b;
  if (c < 0) {
    console.log("C is negative");
    return;
  }

  let D = (C * Math.sin(b)) / Math.sin(c);
  if (D < 0 || D > C) {
    D = C;
    t = Math.PI / 4;
  }

  const turn = (k + 2) % 8 == k2 ? -t : t;
  const x2 = corner.x + D * Math.cos(corner.rotation + turn);
  const y2 = corner.y + D * Math.sin(corner.rotation + turn);
  drawLine(ctx, corner.x, corner.y, x2, y2);
};

/**
 *
 * @param {number} width canvas width in pixels
 * @param {number} height canvas height in pixels
 * @param {number} spacing pixels
 * @returns {{ x: number, y: number, i: number, j: number}[][]}
 *
 */
const createCartesianGrid = (width, height, spacing) => {
  const grid = [];
  for (let i = 0; i < width / spacing; i++) {
    grid[i] = [];
    for (let j = 0; j < height / spacing; j++) {
      grid[i][j] = {
        x: i * spacing,
        y: j * spacing,
        i,
        j
      };
    }
  }
  return grid;
};

/**
 *
 * @param {{ x: number, y: number, i: number, j: number}[][]} grid
 * @returns {{ x: number, y: number, i: number, j: number, points: { x: number, y: number, rotation: number, i: number, j: number}[] }[][]}
 */
const createPolarGrid = (inputGrid, radius) => {
  const grid = inputGrid;
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const element = grid[i][j];
      element.corners = [];
      for (let k = 0; k < 8; k++) {
        const angle = (Math.PI / 4) * k;
        element.corners[k] = {
          x: element.x + radius * Math.cos(angle),
          y: element.y + radius * Math.sin(angle),
          rotation: angle,
          i,
          j
        };
      }
    }
  }
  return grid;
};

const createGrid = (canvas, radius) =>
  createPolarGrid(
    createCartesianGrid(canvas.width, canvas.height, radius * 2),
    radius
  );

const onLoad = async () => {
  const canvas = document.getElementById("pattern");
  const ctx = canvas.getContext("2d");

  let radius = 19;
  let grid = createGrid(canvas, radius);

  canvas.addEventListener("mousemove", e => {
    mouseX = e.pageX;
    mouseY = e.pageY;
    console.log(mouseX, mouseY);
    draw(ctx, canvas, grid, radius);
    ctx.stroke();
  });

  const radiusControl = document.getElementById("radius");
  radiusControl.addEventListener("change", evt => {
    radius = evt.target.value;
    grid = createGrid(canvas, radius);
    console.log("Radius: ", radius);
  });

  const mouseSensitivityControl = document.getElementById("mouse-sensitivity");
  mouseSensitivityControl.addEventListener("change", evt => {
    mouseSensitivity = evt.target.value;
    console.log("Mouse Sensitivity: ", mouseSensitivity);
  });
};

window.addEventListener("load", onLoad, false);
