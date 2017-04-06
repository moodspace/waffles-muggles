let canvas;
let modebit = 0; // 0: pointer, 1: rect, 2: poly, 3: mark, 4: layer, 5: stack
let objects = [];
let objectsRedo = [];
let helpTextTimeout;
let errorTextTimeout;
let metaObjects = {};
let libraries = [];
let floors = [];
let activeLibrary = -1;
let activeFloor = -1;
let saveCounter = 0;
let zoomLevel = 1;
let rawFloorSize = [0, 0];
let mousedownPoint;
let mousemovePoint;

const helpText = [
  'Click to select an element on canvas.',
  'Draw a rectangle on canvas. Click to start a new point. Click again to finish.',
  'Draw a polygon on canvas. Click to start a new point. Double click to finish.',
  'Add interactivity to an area on canvas.',
  'Edit floor properties.',
  'Edit stack properties.',
  'Drag and move the canvas.',
];

function showHelp(help) {
  $('.help-text').html(`<span class="white-text">${help}</span>`);
  $('.help-text').fadeIn();
  if (helpTextTimeout) {
    clearInterval(helpTextTimeout);
  }
  helpTextTimeout = setTimeout(() => {
    $('.help-text').fadeOut();
  }, 5000);
}

function showError(error) {
  const errTxt = error.charAt(0).toUpperCase() + error.slice(1);
  $('.error-text').html(`<span class="white-text">${errTxt}.</span>`);
  $('.error-text').fadeIn();
  if (errorTextTimeout) {
    clearInterval(errorTextTimeout);
  }
  errorTextTimeout = setTimeout(() => {
    $('.error-text').fadeOut();
  }, 5000);
}

/**
 * Scale a physical point on svg canvas to coordinates stored in data.
 * @param  {[x,y]} p [a physical point on svg canvas]
 * @return {[x',y']} p [coordinates stored in data]
 */
function scalePhysical(p) {
  if (_.isArray(p)) {
    if (p.length === 2 && _.isNumber(p[0]) && _.isNumber(p[0])) {
      return [p[0] / zoomLevel, p[1] / zoomLevel];
    }
    return p.map(pt => [pt[0] / zoomLevel, pt[1] / zoomLevel]);
  } else if (_.isNumber(p)) {
    return p / zoomLevel;
  }
  return false;
}

/**
 * Scale coordinates stored in data to a physical point on svg canvas.
 * @param {[x',y']} p [coordinates stored in data]
 * @return  {[x,y]} p [a physical point on svg canvas]
 */
function scale(p) {
  if (_.isArray(p)) {
    if (p.length === 2 && _.isNumber(p[0]) && _.isNumber(p[0])) {
      return [p[0] * zoomLevel, p[1] * zoomLevel];
    }
    return p.map(pt => [pt[0] * zoomLevel, pt[1] * zoomLevel]);
  } else if (_.isNumber(p)) {
    return p * zoomLevel;
  }
  return false;
}

function addGrids() {
  canvas.selectAll('g:first-child').remove();

  const w = canvas.attr('width');
  const h = canvas.attr('height');
  const g = canvas.append('g');
  const gridNum = [
    Math.floor(w / 50),
    Math.floor(h / 50),
  ];
  for (let i = 1; i <= gridNum[1]; i += 1) {
    g.append('line').attrs({
      x1: 0,
      x2: w,
      y1: i * 50,
      y2: i * 50,
      'stroke-dasharray': '1, 5',
      'stroke-width': '1',
      stroke: '#AAA',
    });
  }

  for (let j = 1; j <= gridNum[0]; j += 1) {
    g.append('line').attrs({
      y1: 0,
      y2: h,
      x1: j * 50,
      x2: j * 50,
      'stroke-dasharray': '1, 5',
      'stroke-width': '1',
      stroke: '#AAA',
    });
  }
}

function toggleUndoRedo() {
  if (objects.length === 0) {
    $('#nav-undo').addClass('disabled');
  } else {
    $('#nav-undo').removeClass('disabled');
  }
  if (objectsRedo.length === 0) {
    $('#nav-redo').addClass('disabled');
  } else {
    $('#nav-redo').removeClass('disabled');
  }
}

function setTools(level) {
  // level 0 or nil: disable all
  // level 1: only 'new' buttons
  // level 2: toolbox, nav except save / json / undo / redo
  // level 3: all, except undo / redo
  $('.nav-wrapper > ul > li > a').addClass('disabled');
  $('.nav-wrapper input').prop('disabled', true);
  $('#btn-output-save').addClass('disabled');
  $('#btn-output-JSON').addClass('disabled');
  $('.toolbox a.btn-flat').addClass('disabled');

  if (level > 0) {
    $('#btn-canvas-new').removeClass('disabled');
  }
  if (level > 1) {
    $('.nav-wrapper > ul.left > li > a').removeClass('disabled');
    $('.nav-wrapper input').prop('disabled', false);
    $('.toolbox a.btn-flat').removeClass('disabled');
    $('.dropdown-button').dropdown({
      belowOrigin: true,
    });
  }
  if (level > 2) {
    $('.nav-wrapper > ul.right > li > a').removeClass('disabled');
  }
  toggleUndoRedo();
}

/**
 * Called upon changing zoom level, only changing attributes of shapes
 * @return {[type]}              [description]
 */
function rerender() {
  addGrids();
  if (metaObjects.floor_border) {
    const obj = metaObjects.floor_border;
    const points = obj.data.points.map(c => scale(c).join(',')).join(' ');
    canvas.select(`#${obj.id}`).attr('points', points);
  }

  objects.forEach((obj) => {
    if (obj.type === 'rect') {
      canvas.select(`#${obj.id}`).attrs({
        x: scale(obj.data.x),
        y: scale(obj.data.y),
        width: scale(obj.data.width),
        height: scale(obj.data.height),
      });
    } else if (obj.type === 'polygon') {
      const points = obj.data.points.map(c => scale(c).join(',')).join(' ');
      canvas.select(`#${obj.id}`).attr('points', points);
    } else if (obj.type === 'stack') {
      const center = scale([obj.meta.cx, obj.meta.cy]);
      const rotation = obj.meta.rotation;
      canvas.select(`#${obj.id}`).attrs({
        x: scale(obj.data.x),
        y: scale(obj.data.y),
        width: scale(obj.data.width),
        height: scale(obj.data.height),
        transform: `rotate(${rotation} ${center[0]} ${center[1]})`,
      });
    }
  });
}

function setZoomLevel(level) {
  const oldZoomLevel = zoomLevel;

  if (level.includes('%')) {
    zoomLevel = parseFloat(level.replace('%', '')) / 100;
  } else if (level === 'Fit width') {
    zoomLevel = ($('#workspace').width() - 20) / rawFloorSize[0];
  } else if (level === 'Fit window') {
    zoomLevel = Math.min(($('#workspace').width() - 20) / rawFloorSize[0],
      ($('#workspace').height() - 20) / rawFloorSize[1]);
  }
  const w = zoomLevel * rawFloorSize[0];
  const h = zoomLevel * rawFloorSize[1];
  canvas.attrs({
    width: w,
    height: h,
  });

  canvas.style('left', Math.max(0, 0.5 * ($('#workspace').width() - w)));
  canvas.style('top', Math.max(0, 0.5 * ($(window).height() - h - 64)));

  rerender(oldZoomLevel);
}

function offsetPoints(points, dx, dy) {
  return points.map(p => [
    p[0] + dx,
    p[1] + dy,
  ]);
}

function offsetStack(stackMeta, dx, dy) {
  const newMeta = _.clone(stackMeta);
  newMeta.cx += dx;
  newMeta.cy += dy;
  return newMeta;
}

function pointsToArray(strPoints) {
  return strPoints.split(' ').map(p => [
    parseInt(p.split(',')[0], 10),
    parseInt(p.split(',')[1], 10),
  ]);
}

function rectToArray(rect) {
  const attrs = [
    parseInt(rect.attr('x'), 10),
    parseInt(rect.attr('y'), 10),
    parseInt(rect.attr('width'), 10),
    parseInt(rect.attr('height'), 10),
  ];
  return [
    [
      attrs[0], attrs[1],
    ],
    [
      attrs[0] + attrs[2],
      attrs[1],
    ],
    [
      attrs[0] + attrs[2],
      attrs[1] + attrs[3],
    ],
    [
      attrs[0], attrs[1] + attrs[3],
    ],
  ];
}

function arrayToPoints(points) {
  return points.map(p => [p[0], p[1]].join(',')).join(' ');
}

function prunePoints(points) {
  const ret = [];
  let lastPoint = points[0];
  ret.push(lastPoint);
  points.unshift();
  points.forEach((p) => {
    if (Math.abs(lastPoint[0] - p[0]) > 5 || Math.abs(lastPoint[1] - p[1]) >
      5) {
      if (Math.abs(lastPoint[0] - p[0]) <= 5) {
        ret.push([lastPoint[0], p[1]]);
      } else if (Math.abs(lastPoint[1] - p[1]) <= 5) {
        ret.push([p[0], lastPoint[1]]);
      } else {
        ret.push(p);
      }
    }
    lastPoint = p;
  });
  return ret;
}

function exportFloorData() {
  if (!metaObjects.floor_border) {
    return {
      floor: {},
      stacks: [],
    };
  }
  let floorJson = {};
  const floorPoints = metaObjects.floor_border.data.points;

  const deltaX = d3.min(floorPoints, e => e[0]);
  const deltaY = d3.min(floorPoints, e => e[1]);

  floorJson = {
    name: $('#cfloor-name').val(),
    size_x: parseInt(canvas.attr('width'), 10),
    size_y: parseInt(canvas.attr('height'), 10),
    geojson: JSON.stringify({
      type: 'polygon',
      coordinates: offsetPoints(floorPoints, -deltaX, -deltaY),
    }),
  };

  const stacksJson = [];
  objects.forEach((obj) => {
    if (obj.type === 'stack') {
      stacksJson.push(offsetStack(obj.meta, -deltaX, -deltaY));
    }
  });

  return {
    floor: floorJson,
    stacks: stacksJson,
  };
}

function randomId() {
  return [
    Math.ceil(Math.random() * 100),
    Math.ceil(Math.random() * 100),
    Math.ceil(Math.random() * 100),
  ].join('-');
}

function clearSelection() {
  canvas.selectAll('.selected').classed('selected', false);
  $('.tool-options > .row').hide();
  $('.tool-options > .row:nth-child(1)').show();
  Materialize.updateTextFields();
}

function selectRect(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  $('#crect-x').val($(`#${id}`).attr('x'));
  $('#crect-y').val($(`#${id}`).attr('y'));
  $('#crect-width').val($(`#${id}`).attr('width'));
  $('#crect-height').val($(`#${id}`).attr('height'));
  $('.tool-options > .row').hide();
  $('.tool-options > .row:nth-child(2)').show();
  Materialize.updateTextFields();
}

function selectPolygon(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  $('#cpolygon-points').val($(`#${id}`).attr('points'));
  $('.tool-options > .row').hide();
  $('.tool-options > .row:nth-child(3)').show();
  Materialize.updateTextFields();
}

function removeShapeData(id) {
  _.pullAllBy(objects, [{ id }], 'id');
}

/**
 * Find shape data and its index
 * @param  {[type]} id [description]
 * @return {{index, value}}    [description]
 */
function findShapeData(id) {
  const ret = [];
  _.each(objects, (v, idx) => {
    if (v.id === id) {
      ret.push({ index: idx, value: v });
    }
  });
  return ret;
}

function showMarkTool(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  const objData = findShapeData(id)[0].value;
  $('#cmark-rows').val(objData.meta.rows);
  $('#cmark-rotation').material_select('destroy');
  $('#cmark-rotation').val(objData.meta.rotation);
  $('#cmark-rotation').material_select();
  $(`.tool-options > .row:nth-child(${modebit + 1})`).show();
  Materialize.updateTextFields();
}

function showStackTool(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  const stackData = findShapeData(id)[0].value;
  if (stackData) {
    $('#cstack-oversize').material_select('destroy');
    $('#cstack-oversize').val(stackData.meta.oversize);
    $('#cstack-oversize').material_select();
    $('#cstack-rotation').val(stackData.meta.rotation);
    $('#cstack-startClass').val(stackData.meta.startClass);
    $('#cstack-startSubclass').val(stackData.meta.startSubclass);
    $('#cstack-startSubclass2').val(stackData.meta.startSubclass2);
    $('#cstack-endClass').val(stackData.meta.endClass);
    $('#cstack-endSubclass').val(stackData.meta.endSubclass);
    $('#cstack-endSubclass2').val(stackData.meta.endSubclass2);
    $(`.tool-options > .row:nth-child(${modebit + 1})`).show();
    Materialize.updateTextFields();
  }
}

function addClickHandlerToShape(e) {
  e.on('mousedown', () => {
    if (!e.classed('cobject')) {
      return;
    }
    e.each(() => {
      d3.event.target.parentNode.appendChild(d3.event.target);
    });
    switch (modebit) {
      case 0:
        if (e.attr('points')) {
          selectPolygon(e.attr('id'));
        } else if (e.classed('cobject') && e.attr('x')) {
          selectRect(e.attr('id'));
        }
        mousedownPoint = d3.mouse(event.currentTarget);
        break;
      case 3:
        if (!e.classed('cstack')) {
          showMarkTool(e.attr('id'));
        }
        break;
      case 5:
        if (e.classed('cstack')) {
          showStackTool(e.attr('id'));
        }
        break;
      case 6:
        mousedownPoint = d3.mouse(event.currentTarget);
        break;
      default:

    }
    mousemovePoint = mousedownPoint;
  });
}

function confirmNewShape(shape, id, settings) {
  const idShort = id.replace('canvas-e-', ''); // can accept both forms
  shape.classed('active', false);
  shape.classed('active_fb', false);
  if (!settings || !settings.readonly) {
    shape.classed('cobject', true);
  }
  shape.attrs({
    id: `canvas-e-${idShort}`,
    stroke: settings && settings.stroke ?
      settings.stroke : '#F66',
    fill: settings && settings.readonly ?
      'transparent' : 'rgba(38, 50, 56, 0.5)',
  });
  if (!settings || !settings.redo) {
    objectsRedo = [];
  }

  if (!settings || !settings.readonly) {
    addClickHandlerToShape(shape);
  }
  switch (modebit) {
    case 1:
      selectRect(shape.attr('id'));
      break;
    case 2:
      selectPolygon(shape.attr('id'));
      break;
    default:

  }
}

function deleteObj(index) {
  const obj = objects.splice(index, 1)[0];
  $(`#${obj.id}`).remove();
  objects.push({ type: 'action.delete', data: obj, meta: { index } });
  toggleUndoRedo();
}

/**
 * Draw a shape on canvas based on data. Does not change history.
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
function redraw(obj) {
  switch (obj.type) {
    case 'rect':
      {
        const rect = canvas.append('rect');
        rect.attrs({
          x: scale(obj.data.x),
          y: scale(obj.data.y),
          width: scale(obj.data.width),
          height: scale(obj.data.height),
        });
        // rect redrawn and restored
        confirmNewShape(rect, obj.id, {
          redo: true,
        });
        break;
      }
    case 'polygon':
      {
        const polygon = canvas.append('polygon');
        polygon.attr('points', arrayToPoints(scale(obj.data.points)));
        // rect redrawn and restored
        confirmNewShape(polygon, obj.id, {
          redo: true,
        });
        break;
      }
    case 'stack':
      {
        const groupId = obj.meta.for;
        if (canvas.select(`g[for='${groupId}']`).empty()) {
          canvas.append('g').attr('for', groupId);
        }
        const group = canvas.select(`g[for='${groupId}']`);
        const rect = group.append('rect').attrs({
          x: scale(obj.data.x),
          y: scale(obj.data.y),
          width: scale(obj.data.width),
          height: scale(obj.data.height),
        }).classed('cstack', true);
        const rectCenter = [];
        rectCenter[0] = obj.data.x + (obj.data.width * 0.5);
        rectCenter[1] = obj.data.y + (obj.data.height * 0.5);
        const transVals = [
          obj.meta.rotation,
          scale(rectCenter[0]),
          scale(rectCenter[1]),
        ].join(' ');
        rect.attr('transform', `rotate(${transVals})`);
        confirmNewShape(rect, obj.id, {
          stroke: '#0AC',
          redo: true,
        });
        // stack redrawn and restored
        break;
      }
    default:

  }
}

function generateRectData(shape) {
  const id = shape.attr('id');
  objects = objects.map((obj) => {
    if (obj.id === id && obj.type !== 'stack') {
      const newObj = _.clone(obj);
      newObj.data = {
        x: parseInt(shape.attr('x'), 10),
        y: parseInt(shape.attr('y'), 10),
        width: parseInt(shape.attr('width'), 10),
        height: parseInt(shape.attr('height'), 10),
      };
      return newObj;
    }
    return obj;
  });
}

function generatePolygonData(shape) {
  const id = shape.attr('id');
  objects = objects.map((obj) => {
    if (obj.id === id && obj.type !== 'stack') {
      const newObj = _.clone(obj);
      newObj.data = {
        points: pointsToArray(shape.attr('points')),
      };
      return newObj;
    }
    return obj;
  });
}

function generateStackData(shape) {
  const id = shape.attr('id');
  objects = objects.map((obj) => {
    if (obj.id === id && obj.type === 'stack') {
      const newObj = _.clone(obj);
      newObj.data.x = parseInt(shape.attr('x'), 10);
      newObj.data.y = parseInt(shape.attr('y'), 10);
      newObj.data.width = parseInt(shape.attr('width'), 10);
      newObj.data.height = parseInt(shape.attr('height'), 10);
      // update meta
      newObj.meta.cx = newObj.data.x + (newObj.data.width / 2);
      newObj.meta.cy = newObj.data.y + (newObj.data.height / 2);
      newObj.meta.lx = newObj.data.width;
      newObj.meta.ly = newObj.data.height;
      return newObj;
    }
    return obj;
  });
}

function generateStackMeta(shape) {
  const id = shape.attr('id');
  objects = objects.map((obj) => {
    if (obj.id === id && obj.type === 'stack') {
      const newObj = _.clone(obj);
      newObj.meta.oversize = parseInt($(
        '#cstack-oversize').val(), 10);
      shape.classed('size0', false).classed('size1', false).classed(
        'size2', false).classed(
        `size${$('#cstack-oversize').val()}`, true);
      newObj.meta.startClass = $(
        '#cstack-startClass').val().trim().toUpperCase();
      newObj.meta.startSubclass = Math.floor(
        parseFloat($('#cstack-startSubclass').val(), 10));
      newObj.meta.startSubclass2 = $(
        '#cstack-startSubclass2').val().trim().toUpperCase();
      newObj.meta.endClass = $('#cstack-endClass')
        .val().trim().toUpperCase();
      newObj.meta.endSubclass = Math.ceil(
        parseFloat($('#cstack-endSubclass').val(), 10));
      newObj.meta.endSubclass2 = $(
        '#cstack-endSubclass2').val().trim().toUpperCase();
      return newObj;
    }
    return obj;
  });
}

/**
 * Undo last step.
 * @return {[type]} [description]
 */
function undo() {
  const obj = objects.pop();
  switch (obj.type) {
    case 'action.delete':
      {
        // restore obj to canvas
        objects.splice(obj.meta.index, 0, obj.data);
        redraw(obj.data);
        break;
      }
    default:
      $(`#${obj.id}`).remove();
  }
  objectsRedo.push(obj);
  toggleUndoRedo();
}

/**
 * Redo last step.
 * @return {[type]} [description]
 */
function redo() {
  const obj = objectsRedo.pop();
  switch (obj.type) {
    case 'action.delete':
      {
        // (redo) remove obj from canvas
        const objToDel = objects.splice(obj.meta.index, 1)[0];
        $(`#${objToDel.id}`).remove();
        break;
      }
    default:
      redraw(obj);
  }
  objects.push(obj);
  toggleUndoRedo();
}

function initCanvas(w, h, bgimageUrl) {
  $('#workspace').html('');
  canvas = d3.select('#workspace').append('svg').attrs({
    id: 'canvas',
    width: w,
    height: h,
  }).classed('z-depth-1', true);
  canvas.style('left', Math.max(0, 0.5 * ($('#workspace').width() - w)));
  canvas.style('top', Math.max(0, 0.5 * ($(window).height() - h - 64)));
  rawFloorSize = [w, h];

  canvas.selectAll('*').remove();

  canvas.append('image').attrs({
    id: 'canvas-e-bgimg',
    'xlink:href': bgimageUrl,
    width: '100%',
    height: '100%',
  });

  addGrids();
  modebit = 0;
  objects = [];
  objectsRedo = [];
  metaObjects = {};
  saveCounter = 0;

  canvas.style('cursor', 'default');
  $('#btn-zoom').text('100%');
  $('.toolbox a.btn-flat').removeClass('light-blue lighten-2');
  $('.toolbox a.btn-flat:first-child').addClass('light-blue lighten-2');
  $('.tool-options > .row').hide();
  $('.tool-options > .row:nth-child(1)').show();
  $('.tool-options input').val(0);
  $('.tool-options input').val('');
  $('#cfloor-btn-set').removeClass('disabled');

  setTools(2);

  canvas.on('click', () => {
    const point = d3.mouse(event.currentTarget);

    switch (modebit) {
      case 1:
        {
          const activeRect = canvas.select('rect.active');
          if (activeRect.empty()) {
            const rect = canvas.append('rect').classed('active', true);
            rect.attrs({
              x: point[0],
              y: point[1],
              'stroke-width': '1',
              stroke: '#F66',
              fill: 'rgba(239, 108, 0, 0.5)',
            });
            rect.attrs({
              x0: point[0],
              y0: point[1],
            });
          } else {
            const rectW = Math.abs(point[0] - activeRect.attr('x0'));
            const rectH = Math.abs(point[1] - activeRect.attr('y0'));
            if (point[0] < activeRect.attr('x0')) {
              activeRect.attr('x', point[0]);
            } else {
              activeRect.attr('x', activeRect.attr('x0'));
            }
            if (point[1] < activeRect.attr('y0')) {
              activeRect.attr('y', point[1]);
            } else {
              activeRect.attr('y', activeRect.attr('y0'));
            }
            activeRect.attr('width', rectW).attr('height', rectH);
            // rect created and stored
            const rid = randomId();
            objects.push({
              id: `canvas-e-${rid}`,
              type: 'rect',
              meta: {
                rows: 0,
                rotation: 0,
                g: [],
              },
              data: {
                x: scalePhysical(parseInt(activeRect.attr('x'), 10)),
                y: scalePhysical(parseInt(activeRect.attr('y'), 10)),
                width: scalePhysical(parseInt(activeRect.attr('width'),
                  10)),
                height: scalePhysical(parseInt(activeRect.attr('height'),
                  10)),
              },
            });
            toggleUndoRedo();
            confirmNewShape(activeRect, rid);
          }
          break;
        }
      case 2:
        {
          const activePolygon = canvas.select('polygon.active');
          if (activePolygon.empty()) {
            canvas.append('polygon').classed('active', true).attrs({
              points: point.join(','),
              'stroke-width': '1',
              stroke: '#F66',
              fill: 'rgba(239, 108, 0, 0.5)',
            });
          } else {
            activePolygon.attr('points',
              `${activePolygon.attr('points')} ${point.join(',')}`);
          }
          break;
        }
      case 4:
        {
          if (!$('#cfloor-btn-set').hasClass('disabled')) {
            break;
          }
          const activeFbPolygon = canvas.select('polygon.active_fb');
          if (activeFbPolygon.empty()) {
            canvas.insert('polygon', ':nth-child(2)').classed('active_fb',
                true)
              .attrs({
                points: point.join(','),
                'stroke-width': '1',
                stroke: '#F66',
                fill: 'rgba(239, 108, 0, 0.5)',
              });
          } else {
            activeFbPolygon.attr('points',
              `${activeFbPolygon.attr('points')} ${point.join(',')}`);
          }
          break;
        }
      default:

    }
  });

  canvas.on('mousedown', () => {
    switch (modebit) {
      case 0:
        mousedownPoint = d3.mouse(event.currentTarget);
        break;
      case 6:
        mousedownPoint = d3.mouse(event.currentTarget);
        break;
      default:
        mousedownPoint = undefined;
    }
    mousemovePoint = mousedownPoint;
  });

  canvas.on('mouseup', () => {
    mousedownPoint = undefined;
    mousemovePoint = undefined;
  });

  canvas.on('mousemove', () => {
    const point = d3.mouse(event.currentTarget);
    const scaledPt = scalePhysical(point);
    scaledPt[0] = parseInt(scaledPt[0], 10);
    scaledPt[1] = parseInt(scaledPt[1], 10);

    if (scaledPt[0] > -1 && scaledPt[1] > -1) {
      $('#label-coords').text(scaledPt.join(', '));
    } else {
      $('#label-coords').text('');
    }

    switch (modebit) {
      case 0:
        {
          const rect = canvas.select('rect.selected');
          const polygon = canvas.select('polygon.selected');
          if (!mousedownPoint) {
            break;
          }
          const cLeftOffset = point[0] - mousemovePoint[0];
          const cTopOffset = point[1] - mousemovePoint[1];
          if (point[0] < 0 || point[0] >= canvas.attr('width') || point[1] <
            0 || point[1] >= canvas.attr('height')) {
            mousedownPoint = undefined;
            mousemovePoint = undefined;
            break;
          }
          if (!rect.empty()) {
            const orig = [
              parseInt(rect.attr('x'), 10),
              parseInt(rect.attr('y'), 10),
            ];
            rect.attr('x', orig[0] + cLeftOffset);
            rect.attr('y', orig[1] + cTopOffset);
            mousemovePoint = point;
            if (_.isEmpty(rect.attr('transform'))) {
              generateRectData(rect);
              break;
            }
            // rotated rect only
            const rotationVals = rect.attr('transform').replace(
                /\w+/, '')
              .replace('(', '').replace(')', '')
              .split(' ')
              .map(v => parseInt(v, 10));
            const newRotationString = [
              rotationVals[0],
              rotationVals[1] + cLeftOffset,
              rotationVals[2] + cTopOffset,
            ].join(' ');
            rect.attr('transform', `rotate(${newRotationString})`);
            generateStackData(rect);
          } else if (!polygon.empty()) {
            const pointsArray = pointsToArray(polygon.attr('points'));
            polygon.attr('points',
              arrayToPoints(
                offsetPoints(pointsArray, cLeftOffset, cTopOffset)));
            mousemovePoint = point;
            generatePolygonData(polygon);
          }
          break;
        }
      case 1:
        {
          const activeRect = canvas.select('rect.active');
          if (!activeRect.empty()) {
            const rectW = Math.abs(point[0] - activeRect.attr('x0'));
            const rectH = Math.abs(point[1] - activeRect.attr('y0'));
            if (point[0] < activeRect.attr('x0')) {
              activeRect.attr('x', point[0]);
            } else {
              activeRect.attr('x', activeRect.attr('x0'));
            }
            if (point[1] < activeRect.attr('y0')) {
              activeRect.attr('y', point[1]);
            } else {
              activeRect.attr('y', activeRect.attr('y0'));
            }
            activeRect.attr('width', rectW).attr('height', rectH);
          }
          break;
        }
      case 2:
        {
          const activePolygon = canvas.select('polygon.active');
          if (!activePolygon.empty()) {
            activePolygon.attr('points', [
              activePolygon.attr('points').replace(
                /\s+[-\d.]+,[-\d.]+$/, ''),
              point.join(','),
            ].join(' '));
          }
          break;
        }
      case 4:
        {
          const activeFbPolygon = canvas.select('polygon.active_fb');
          if (!activeFbPolygon.empty()) {
            activeFbPolygon.attr('points', [
              activeFbPolygon.attr('points').replace(
                /\s+[-\d.]+,[-\d.]+$/, ''),
              point.join(','),
            ].join(' '));
          }
          break;
        }
      case 6:
        {
          if (!mousedownPoint) {
            break;
          }
          const cLeftOffset = point[0] - mousedownPoint[0];
          const cTopOffset = point[1] - mousedownPoint[1];
          const orig = [
            parseInt(canvas.style('left'), 10),
            parseInt(canvas.style('top'), 10),
          ];
          if (orig[0] + cLeftOffset > $('#workspace').width() / 2 ||
            $('#workspace > svg').width() + orig[0] + cLeftOffset < $(
              '#workspace').width() / 2 ||
            orig[1] + cTopOffset > $('#workspace').height() / 2 ||
            $('#workspace > svg').height() + orig[1] + cTopOffset < $(
              '#workspace').height() / 2) {
            mousedownPoint = undefined;
            mousemovePoint = undefined;
            break;
          }
          canvas.style('left', orig[0] + cLeftOffset);
          canvas.style('top', orig[1] + cTopOffset);
          break;
        }
      default:

    }
  });

  canvas.on('dblclick', () => {
    const point = d3.mouse(event.currentTarget);

    switch (modebit) {
      case 2:
        {
          const activePolygon = canvas.select('polygon.active');
          if (!activePolygon.empty()) {
            let newPoints =
              `${activePolygon.attr('points')} ${point.join(',')}`;
            const newPointsArr = prunePoints(pointsToArray(newPoints));
            newPoints = arrayToPoints(newPointsArr);
            activePolygon.attr('points', newPoints);
            // polygon created and stored
            const rid = randomId();
            objects.push({
              id: `canvas-e-${rid}`,
              type: 'polygon',
              meta: {
                rows: 0,
                rotation: 0,
                g: [],
              },
              data: {
                points: scalePhysical(newPointsArr),
              },
            });
            toggleUndoRedo();
            confirmNewShape(activePolygon, rid);
          }
          break;
        }
      case 4:
        {
          const activeFbPolygon = canvas.select('polygon.active_fb');
          if (!activeFbPolygon.empty()) {
            let newPoints =
              `${activeFbPolygon.attr('points')} ${point.join(',')}`;
            const newPointsArr = prunePoints(pointsToArray(newPoints));
            newPoints = arrayToPoints(newPointsArr);
            activeFbPolygon.attr('points', newPoints).classed('fb', true);
            // polygon created and stored
            const rid = randomId();
            metaObjects.floor_border = {
              type: 'f_border',
              id: `canvas-e-${rid}`,
              data: {
                points: scalePhysical(newPointsArr),
              },
            };
            confirmNewShape(activeFbPolygon, rid, {
              readonly: true,
            });
          }
          $('#cfloor-btn-set').removeClass('disabled');
          // re-enable output buttons that are always disabled in setTools
          setTools(3);
          canvas.style('cursor', 'default').selectAll('*').style('cursor',
            'default');
          break;
        }
      default:

    }
  });

  $(document).on('keypress', () => {
    if (event.which === 127 && !canvas.select('.selected').empty()) {
      deleteObj(findShapeData(canvas.select('.selected').attr('id'))[0].index);
      clearSelection();
    }
  });
  // END initCanvas
}

function loadFloors(libraryId) {
  $('#btn-add-floor').show();

  $.ajax({
    url: '/v1/floors/',
    type: 'GET',
    data: {
      library_id: libraryId,
    },
    success: (data) => {
      floors = data;

      $('#floor-collection').html('');
      floors.forEach((floor) => {
        const floorItem = $(
          [
            '<a href="javascript:void(0)" class="collection-item blue-grey-text text-lighten-5',
            `blue-grey darken-4" data-floor_id=${floor.id}>${floor.name}</a>`,
          ].join(' '),
        ).appendTo($(
          '#floor-collection'));
        if (floor.id === activeFloor) {
          floorItem.addClass('active');
          $('#cfloor-name').val(floor.name);
          Materialize.updateTextFields();
        }
      });

      $('#floor-collection>a').click(() => {
        const floorIdx = _.findIndex(floors, {
          id: $(event.currentTarget).data('floor_id'),
        });
        if (activeFloor === floors[floorIdx].id) {
          // same floor
          return;
        }

        $('#floor-collection>a').removeClass('active');

        activeFloor = floors[floorIdx].id;
        setTools(1);
        if (floors[floorIdx].ref) {
          initCanvas(floors[floorIdx].size_x, floors[floorIdx].size_y,
            floors[floorIdx].ref);
        }

        $('#cfloor-name').val(floors[floorIdx].name);
        Materialize.updateTextFields();
        $(event.currentTarget).addClass('active');
      });

      $('.collapsible').collapsible('close', 0);
      $('.collapsible').collapsible('open', 0);
    },
    error: (e) => {
      showError(e.responseJSON.message);
    },
  });
}

function loadLibraries() {
  $('#btn-add-floor').hide();
  $.ajax({
    url: '/v1/libraries/',
    type: 'GET',
    success: (data) => {
      libraries = data;

      $('#library-collection').html('');
      libraries.forEach((lib) => {
        const item = $([
          '<a href="javascript:void(0)" class="collection-item blue-grey-text text-lighten-5',
          `blue-grey darken-4" data-library_id=${lib.id}>${lib.name}</a>`,
        ].join(' ')).appendTo($(
          '#library-collection'));
        if (lib.id === activeLibrary) {
          item.addClass('active');
          loadFloors(lib.id);
        }
      });

      $('#library-collection>a').click(() => {
        const libraryId = _.findIndex(libraries, {
          id: $(event.currentTarget).data('library_id'),
        });
        if (activeLibrary === libraries[libraryId].id) {
          // same library
          return;
        }

        $('#library-collection>a').removeClass('active');
        setTools(0);
        activeFloor = -1;

        activeLibrary = libraries[libraryId].id;
        loadFloors(activeLibrary);
        $(event.currentTarget).addClass('active');
      });

      $('.collapsible').collapsible('close', 0);
      $('.collapsible').collapsible('open', 0);
    },
    error: (e) => {
      showError(e.responseJSON.message);
    },
  });
}

const rowThickness = 10;

function initStacksInShape(e, rows, rotation) {
  const id = e.attr('id');
  const objIdx = findShapeData(id)[0].index;
  objects[objIdx].meta.rows = rows;
  objects[objIdx].meta.rotation = rotation;

  $('#cmark-rows').val(rows);
  $('#cmark-rotation').val(rotation);

  canvas.select(`g[for="${e.attr('id')}"]`).remove();
  findShapeData(id)[0].value.meta.g.forEach((stackId) => {
    removeShapeData(stackId);
  });

  const polygon = e.attr('points') ?
    pointsToArray(e.attr('points')) :
    rectToArray(e);
  const theta = (Math.PI * rotation) / 180;
  const gamma = (Math.PI / 2) - theta;

  const centeroid = d3.polygonCentroid(polygon);
  const rowNormalEnds = [centeroid.slice(), centeroid.slice()];
  const rowEnds = [centeroid.slice(), centeroid.slice()];
  while (d3.polygonContains(polygon, rowNormalEnds[1])) {
    rowNormalEnds[1][0] += Math.cos(gamma);
    rowNormalEnds[1][1] += Math.sin(gamma);
  }
  while (d3.polygonContains(polygon, rowNormalEnds[0])) {
    rowNormalEnds[0][0] -= Math.cos(gamma);
    rowNormalEnds[0][1] -= Math.sin(gamma);
  }

  while (d3.polygonContains(polygon, rowEnds[1])) {
    // rhs
    rowEnds[1][0] += Math.cos(theta);
    rowEnds[1][1] -= Math.sin(theta);
  }
  while (d3.polygonContains(polygon, rowEnds[0])) {
    // lhs
    rowEnds[0][0] -= Math.cos(gamma);
    rowEnds[0][1] += Math.sin(gamma);
  }

  const centeroidRowLen = Math.sqrt(((rowEnds[0][0] - rowEnds[1][0]) ** 2) +
    ((rowEnds[0][1] - rowEnds[1][1]) ** 2));

  let rowSpacing = Math.sqrt(((rowNormalEnds[0][0] - rowNormalEnds[1][0]) ** 2) +
    ((rowNormalEnds[0][1] - rowNormalEnds[1][1]) ** 2));
  rowSpacing = (rowSpacing / rows) - rowThickness;

  const rectCenter = [
    centeroid[0],
    centeroid[1] - (0.5 * rows * rowThickness) - (0.5 * (rows - 1) *
      rowSpacing),
  ];

  const group = canvas.append('g').attr('for', e.attr('id'));
  const groupIdx = findShapeData(e.attr('id'))[0].index;
  objects[groupIdx].meta.g = [];

  for (let i = 0; i < rows; i += 1) {
    const r = centeroid[1] - rectCenter[1];
    const rectCenterRotated = [
      rectCenter[0] + (r * Math.cos(gamma)),
      (rectCenter[1] + r) - (r * Math.sin(gamma)),
    ];

    const rid = randomId();

    const rect = group.append('rect').attrs({
      x: rectCenterRotated[0] - (centeroidRowLen * 0.5),
      y: rectCenterRotated[1] - (rowThickness * 0.5),
      width: centeroidRowLen,
      height: rowThickness,
    }).classed('cstack', true);

    rect.attr('transform',
      `rotate(${rotation} ${rectCenterRotated[0]} ${rectCenterRotated[1]})`);

    objects.push({
      type: 'stack',
      id: `canvas-e-${rid}`,
      meta: {
        cx: scalePhysical(rectCenterRotated[0]),
        cy: scalePhysical(rectCenterRotated[1]),
        lx: scalePhysical(centeroidRowLen),
        ly: scalePhysical(rowThickness),
        rotation: parseInt(rotation, 10),
        oversize: 0,
        startClass: 'A',
        startSubclass: 0,
        startSubclass2: '',
        endClass: 'Z',
        endSubclass: 0,
        endSubclass2: '',
        for: e.attr('id'),
      },
      data: {
        x: scalePhysical(parseInt(rect.attr('x'), 10)),
        y: scalePhysical(parseInt(rect.attr('y'), 10)),
        width: scalePhysical(parseInt(rect.attr('width'), 10)),
        height: scalePhysical(parseInt(rect.attr('height'), 10)),
      },
    });

    toggleUndoRedo();

    confirmNewShape(rect, rid, {
      stroke: '#0AC',
    });

    rectCenter[1] += (rowThickness + rowSpacing);

    objects[groupIdx].meta.g.push(`canvas-e-${rid}`);
  }

  // END initStacksInShape
}

$(document).ready(() => {
  loadLibraries();

  $('.tool-options > .row').hide();

  $('.toolbox a.btn-flat').each((index) => {
    $(`.toolbox a.btn-flat:nth-child(${index + 1})`).click(() => {
      $('.collapsible').collapsible('close', 0);

      if (modebit !== index) {
        canvas.selectAll('.selected').classed('selected', false);
      }
      modebit = index;

      canvas.style('cursor', 'default').selectAll('*').style(
        'cursor', 'default');

      if (modebit === 1 || modebit === 2) {
        canvas.style('cursor', 'crosshair').selectAll('*').style(
          'cursor', 'crosshair');
      } else if (modebit === 6) {
        canvas.style('cursor', 'move').selectAll('*').style(
          'cursor', 'move');
      } else {
        canvas.style('cursor', 'default').selectAll('*').style(
          'cursor', 'default');
        if (modebit === 3) {
          canvas.selectAll('.cobject:not(.cstack)').style('cursor',
            'pointer');
        }
        if (modebit === 5) {
          canvas.selectAll('.cobject.cstack').style('cursor',
            'pointer');
        }
      }
      $('.tool-options > .row').hide();
      $('.toolbox a.btn-flat').removeClass('light-blue lighten-2');
      if (!canvas.selectAll('.selected').empty()) {
        $(`.tool-options > .row:nth-child(${index + 1})`).show();
      }

      // tool options available without selecting an element
      if (modebit === 0 || modebit === 4) {
        $(`.tool-options > .row:nth-child(${index + 1})`).show();
      }
      $(event.currentTarget).addClass('light-blue lighten-2');
      showHelp(helpText[index]);
    });
  });

  $('#viewmode-toggle').change(() => {
    if (event.currentTarget.checked) {
      canvas.selectAll('g').classed('hidden', false);
    } else {
      canvas.selectAll('g').classed('hidden', true);
    }
  });

  $('#nav-undo').click(() => {
    if ($('#nav-undo').hasClass('disabled')) {
      return;
    }
    undo();
  });

  $('#nav-redo').click(() => {
    if ($('#nav-redo').hasClass('disabled')) {
      return;
    }
    redo();
  });

  $('.row.cmark input, .row.cmark select').change(() => {
    const shape = canvas.selectAll('.selected');
    const irows = parseInt($('#cmark-rows').val(), 10);
    if (_.isNaN(irows) || irows <= 0) {
      return;
    }
    const irotation = parseInt($('#cmark-rotation').val(), 10);
    if (_.isNaN(irotation) || irotation < 0 || irotation > 360) {
      return;
    }
    initStacksInShape(shape, irows, irotation);
  });

  $('.row.crect input').change(() => {
    const shape = canvas.selectAll('.selected');
    shape.attr('x', $('#crect-x').val());
    shape.attr('y', $('#crect-y').val());
    shape.attr('width', $('#crect-width').val());
    shape.attr('height', $('#crect-height').val());

    // for area rect edit
    generateRectData(shape);

    // for stack rect edit
    generateStackData(shape);
  });

  $('.row.cpolygon input').change(() => {
    const shape = canvas.selectAll('.selected');
    shape.attr('points', $('#cpolygon-points').val());
  });

  $('.row.cstack input, .row.cstack select').change(() => {
    const shape = canvas.selectAll('.selected');
    generateStackMeta(shape);
  });

  $('#cfloor-btn-set').click(() => {
    modebit = 4;
    if (metaObjects.floor_border) {
      canvas.select(`polygon[id="${metaObjects.floor_border.id}"]`).remove();
    }
    metaObjects.floor_border = undefined;
    $(event.currentTarget).addClass('disabled');
    canvas.style('cursor', 'crosshair').selectAll('*').style(
      'cursor', 'crosshair');
  });

  $('#dropdown-zoom > li > a').click(() => {
    const zoomLevelVal = $(event.currentTarget).text();
    $('#btn-zoom').text(zoomLevelVal);
    setZoomLevel(zoomLevelVal);
    $('.dropdown-button').dropdown('close');
  });

  $('#btn-canvas-new').click(() => {
    if ($(event.currentTarget).hasClass('disabled')) {
      return;
    }
    $('#modal-new-canvas > div > form > input[name="floor_id"]').val(
      activeFloor);
    $('.modal').modal();
    $('#modal-new-canvas').modal('open');
  });

  $('#btn-canvas-commit-new').click(() => {
    $.ajax({
      url: '/maps/uploadRefImg',
      type: 'POST',
      data: new FormData($('#modal-new-canvas > div > form')[0]),
      success: (floor) => {
        const w = $(
          '#modal-new-canvas>div>div>div:nth-child(1)>input').val();
        const h = $(
          '#modal-new-canvas>div>div>div:nth-child(2)>input').val();
        initCanvas(parseInt(w, 10), parseInt(h, 10), floor.ref);
        loadFloors(activeLibrary);
      },
      error: (e) => {
        showError(e.responseJSON.message);
      },
      contentType: false,
      processData: false,
    });
  });

  $('#btn-output-JSON').click(() => {
    if ($(event.currentTarget).hasClass('disabled')) {
      return;
    }
    $('#box-code-pop').html(JSON.stringify(exportFloorData(), null,
      '  '));
    $('.modal').modal();
    $('#code-popup').modal('open');
    $('pre code').each((i, block) => {
      hljs.highlightBlock(block);
    });
  });

  $('#btn-output-save').click(() => {
    if ($(event.currentTarget).hasClass('disabled')) {
      return;
    }
    const data = exportFloorData();
    saveCounter = data.stacks.length + 1;
    $.ajax({
      url: '/v1/floors',
      type: 'PUT',
      dataType: 'json',
      data: {
        id: activeFloor,
        name: data.floor.name,
        size_x: data.floor.size_x,
        size_y: data.floor.size_y,
        geojson: data.floor.geojson,
        library: activeLibrary,
      },
      success: () => {
        saveCounter -= 1;
        if (saveCounter === 0) {
          showHelp('Save complete!');
        }
      },
      error: (e) => {
        showError(e.responseJSON.message);
      },
    });

    data.stacks.forEach((s) => {
      $.ajax({
        url: '/v1/stacks',
        type: 'POST',
        dataType: 'json',
        data: {
          cx: parseInt(s.cx, 10),
          cy: parseInt(s.cy, 10),
          lx: parseInt(s.lx, 10),
          ly: parseInt(s.ly, 10),
          rotation: s.rotation,
          startClass: s.startClass,
          startSubclass: !_.isNumber(s.startSubclass) ?
            undefined : s.startSubclass,
          startSubclass2: _.isEmpty(s.startSubclass2) ?
            undefined : s.startSubclass2,
          endClass: s.endClass,
          endSubclass: !_.isNumber(s.endSubclass) ? undefined :
            s.endSubclass,
          endSubclass2: _.isEmpty(s.endSubclass2) ? undefined :
            s.endSubclass2,
          oversize: s.oversize,
          floor: activeFloor,
        },
        success: () => {
          saveCounter -= 1;
          if (saveCounter === 0) {
            showHelp('Save complete!');
          }
        },
        error: (e) => {
          showError(e.responseJSON.message);
        },
      });
    });
  });

  $('#btn-add-library').click(() => {
    $('#modal-add-library input').val('');
    $('.modal').modal();
    $('#modal-add-library').modal('open');
  });

  $('#btn-add-floor').click(() => {
    $('#modal-add-floor input').val('');
    $('.modal').modal();
    $('#modal-add-floor').modal('open');
  });

  $('#modal-add-library .modal-action').click(() => {
    let lat = $('#modal-add-library input[name="latitude"]').val();
    lat = _.isEmpty(lat) ? undefined : lat;
    let longt = $('#modal-add-library input[name="longitude"]').val();
    longt = _.isEmpty(longt) ? undefined : longt;

    $.ajax({
      url: '/v1/libraries',
      type: 'POST',
      dataType: 'json',
      data: {
        name: $('#modal-add-library input[name="name"]').val(),
        latitude: lat,
        longitude: longt,
      },
      success: () => {
        loadLibraries();
      },
      error: (e) => {
        showError(e.responseJSON.message);
      },
    });
  });

  $('#modal-add-floor .modal-action').click(() => {
    $.ajax({
      url: '/v1/floors',
      type: 'POST',
      dataType: 'json',
      data: {
        name: $('#modal-add-floor input[name="name"]').val(),
        library: activeLibrary,
      },
      success: () => {
        loadFloors(activeLibrary);
      },
      error: (e) => {
        showError(e.responseJSON.message);
      },
    });
  });

  $('.tooltipped').tooltip({
    delay: 50,
  });

  $('select').material_select();

  setTools(0);

  // END $(document).ready
});
