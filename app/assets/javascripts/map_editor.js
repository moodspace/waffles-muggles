let canvas;
let modebit = 0; // 0: pointer, 1: rect, 2: poly, 3: mark, 4: layer, 5: stack
let objects = [];
let objectsRedo = [];
let helpTextTimeout;
let metaObjects = {};
let libraries = [];
let floors = [];
let activeLibrary = -1;
let activeFloor = -1;
let saveCounter = 0;

const helpText = [
  'Click to select an element on canvas.',
  'Draw a rectangle on canvas. Click to start a new point. Click again to finish.',
  'Draw a polygon on canvas. Click to start a new point. Double click to finish.',
  'Add interactivity to an area on canvas.',
  'Edit floor properties.',
  'Edit stack properties.',
];

function addGrids() {
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

function clearCanvas() {
  canvas.selectAll('*').remove();
  addGrids();
  modebit = 0;
  objects = [];
  objectsRedo = [];
  metaObjects = {};
  saveCounter = 0;

  $('#workspace').css('background-image', '');
  canvas.style('cursor', 'default');
  $('.toolbox a.btn-flat').removeClass('light-blue');
  $('.toolbox a.btn-flat:first-child').addClass('light-blue');
  $('.tool-options > .row').hide();
  $('.tool-options input').val(0);
  $('.tool-options input').val('');
  $('#cfloor-btn-set').removeClass('disabled');
}

function setNav(toEnable) {
  if (toEnable) {
    $('.nav-wrapper a').removeClass('disabled');
    $('.nav-wrapper input').prop('disabled', false);
    $('#btn-output-save').addClass('disabled');
    $('#btn-output-JSON').addClass('disabled');
    $('.toolbox a.btn-flat').removeClass('disabled');
  } else {
    $('.nav-wrapper a').addClass('disabled');
    $('.nav-wrapper input').prop('disabled', true);
    $('.toolbox a.btn-flat').addClass('disabled');
  }
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
          ['<a href="javascript:void(0)" class="collection-item"',
            `data-floor_id=${floor.id}>${floor.name}</a>`,
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
        clearCanvas();

        activeFloor = floors[floorIdx].id;
        setNav(true);
        if (_.isEmpty(floors[floorIdx].ref)) {
          $('#workspace').css('background-image', '');
        } else {
          $('#workspace').css('background-image',
            `url('${floors[floorIdx].ref}')`);
        }
        $('#cfloor-name').val(floors[floorIdx].name);
        Materialize.updateTextFields();
        $(event.currentTarget).addClass('active');
      });

      $('.collapsible').collapsible('close', 0);
      $('.collapsible').collapsible('open', 0);
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
          '<a href="javascript:void(0)" class="collection-item"',
          `data-library_id=${lib.id}>${lib.name}</a>`,
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
        setNav(false);
        activeFloor = -1;
        clearCanvas();

        activeLibrary = libraries[libraryId].id;
        $('#workspace').css('background-image', '');
        loadFloors(activeLibrary);
        $(event.currentTarget).addClass('active');
      });

      $('.collapsible').collapsible('close', 0);
      $('.collapsible').collapsible('open', 0);
    },
  });
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
    parseFloat(rect.attr('x')),
    parseFloat(rect.attr('y')),
    parseFloat(rect.attr('width')),
    parseFloat(rect.attr('height')),
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
  const floorPoints = pointsToArray(metaObjects.floor_border.data.points);

  const deltaX = d3.min(floorPoints, e => e[0]);
  const deltaY = d3.min(floorPoints, e => e[1]);

  floorJson = {
    name: $('#cfloor-name').val(),
    size_x: parseInt(d3.max(floorPoints, e => e[0]) - deltaX, 10),
    size_y: parseInt(d3.max(floorPoints, e => e[1]) - deltaY, 10),
    geojson: JSON.stringify({
      type: 'polygon',
      coordinates: offsetPoints(floorPoints, -deltaX, -deltaY),
    }),
  };

  const stacksJson = [];
  objects.forEach((obj) => {
    if (obj.type === 'stacks') {
      obj.data.forEach((stack) => {
        stacksJson.push(offsetStack(stack.meta, -deltaX, -deltaY));
      });
    }
  });

  return {
    floor: floorJson,
    stacks: stacksJson,
  };
}

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

function randomId() {
  return [
    Math.ceil(Math.random() * 100),
    Math.ceil(Math.random() * 100),
    Math.ceil(Math.random() * 100),
  ].join('-');
}

function selectRect(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  $('#crect-x').val($(`#${id}`).attr('x'));
  $('#crect-y').val($(`#${id}`).attr('y'));
  $('#crect-width').val($(`#${id}`).attr('width'));
  $('#crect-height').val($(`#${id}`).attr('height'));
  $('.tool-options > .row').hide();
  $('.tool-options > .row:nth-child(1)').show();
  Materialize.updateTextFields();
}

function selectPolygon(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  $('#cpolygon-points').val($(`#${id}`).attr('points'));
  $('.tool-options > .row').hide();
  $('.tool-options > .row:nth-child(2)').show();
  Materialize.updateTextFields();
}

function showMarkTool(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  const objIdx = _.findIndex(objects, o => o.id === id && o.type !== 'stacks');
  $('#cmark-rows').val(objects[objIdx].meta.rows);
  $('#cmark-rotation').material_select('destroy');
  $('#cmark-rotation').val(objects[objIdx].meta.rotation);
  $('#cmark-rotation').material_select();
  $(`.tool-options > .row:nth-child(${modebit})`).show();
  Materialize.updateTextFields();
}

function showStackTool(id) {
  canvas.selectAll('.selected').classed('selected', false);
  $(`#${id}`).addClass('selected');
  objects.forEach((obj) => {
    const stackIdx = _.findIndex(obj.data, {
      id,
    });
    if (obj.type === 'stacks' && stackIdx >= 0) {
      $('#cstack-oversize').material_select('destroy');
      $('#cstack-oversize').val(obj.data[stackIdx].meta.oversize);
      $('#cstack-oversize').material_select();
      $('#cstack-rotation').val(obj.data[stackIdx].meta.rotation);
      $('#cstack-startClass').val(obj.data[stackIdx].meta.startClass);
      $('#cstack-startSubclass').val(obj.data[stackIdx].meta.startSubclass);
      $('#cstack-startSubclass2').val(obj.data[stackIdx].meta.startSubclass2);
      $('#cstack-endClass').val(obj.data[stackIdx].meta.endClass);
      $('#cstack-endSubclass').val(obj.data[stackIdx].meta.endSubclass);
      $('#cstack-endSubclass2').val(obj.data[stackIdx].meta.endSubclass2);
      $(`.tool-options > .row:nth-child(${modebit})`).show();
      Materialize.updateTextFields();
    }
  });
}

function addClickHandlerToShape(e) {
  e.on('click', () => {
    if (!e.classed('cobject')) {
      return;
    }
    switch (modebit) {
      case 0:
        if (e.attr('points')) {
          selectPolygon(e.attr('id'));
        } else if (e.classed('cobject') && e.attr('x')) {
          selectRect(e.attr('id'));
        }
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
      default:

    }
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

function initCanvas(w, h) {
  // let x = d3.scaleLinear().domain([0, d3.max(data)]).range([0, width]);
  canvas = d3.select('#canvas').attr('width', w).attr('height', h);
  addGrids();

  canvas.on('click', () => {
    const coords = d3.mouse(event.currentTarget);
    switch (modebit) {
      case 1:
        {
          const activeRect = canvas.select('rect.active');
          if (activeRect.empty()) {
            const rect = canvas.append('rect').classed('active', true);
            rect.attrs({
              x: coords[0],
              y: coords[1],
              'stroke-width': '1',
              stroke: '#F66',
              fill: 'rgba(239, 108, 0, 0.5)',
            });
            rect.attrs({
              x0: coords[0],
              y0: coords[1],
            });
          } else {
            const rectW = Math.abs(coords[0] - activeRect.attr('x0'));
            const rectH = Math.abs(coords[1] - activeRect.attr('y0'));
            if (coords[0] < activeRect.attr('x0')) {
              activeRect.attr('x', coords[0]);
            } else {
              activeRect.attr('x', activeRect.attr('x0'));
            }
            if (coords[1] < activeRect.attr('y0')) {
              activeRect.attr('y', coords[1]);
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
              },
              data: {
                x: parseInt(activeRect.attr('x'), 10),
                y: parseInt(activeRect.attr('y'), 10),
                width: parseInt(activeRect.attr('width'), 10),
                height: parseInt(activeRect.attr('height'), 10),
              },
            });
            confirmNewShape(activeRect, rid);
          }
          break;
        }
      case 2:
        {
          const activePolygon = canvas.select('polygon.active');
          if (activePolygon.empty()) {
            canvas.append('polygon').classed('active', true).attrs({
              points: coords.join(','),
              'stroke-width': '1',
              stroke: '#F66',
              fill: 'rgba(239, 108, 0, 0.5)',
            });
          } else {
            activePolygon.attr('points',
              `${activePolygon.attr('points')} ${coords.join(',')}`);
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
            canvas.insert('polygon', ':first-child').classed('active_fb',
                true)
              .attrs({
                points: coords.join(','),
                'stroke-width': '1',
                stroke: '#F66',
                fill: 'rgba(239, 108, 0, 0.5)',
              });
          } else {
            activeFbPolygon.attr('points',
              `${activeFbPolygon.attr('points')} ${coords.join(',')}`);
          }
          break;
        }
      default:

    }
  });

  canvas.on('mousemove', () => {
    const coords = d3.mouse(event.currentTarget);
    switch (modebit) {
      case 1:
        {
          const activeRect = canvas.select('rect.active');
          if (!activeRect.empty()) {
            const rectW = Math.abs(coords[0] - activeRect.attr('x0'));
            const rectH = Math.abs(coords[1] - activeRect.attr('y0'));
            if (coords[0] < activeRect.attr('x0')) {
              activeRect.attr('x', coords[0]);
            } else {
              activeRect.attr('x', activeRect.attr('x0'));
            }
            if (coords[1] < activeRect.attr('y0')) {
              activeRect.attr('y', coords[1]);
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
              coords.join(','),
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
              coords.join(','),
            ].join(' '));
          }
          break;
        }
      default:

    }
  });

  canvas.on('dblclick', () => {
    const coords = d3.mouse(event.currentTarget);

    switch (modebit) {
      case 2:
        {
          const activePolygon = canvas.select('polygon.active');
          if (!activePolygon.empty()) {
            let newPoints =
              `${activePolygon.attr('points')} ${coords.join(',')}`;
            newPoints = arrayToPoints(prunePoints(pointsToArray(newPoints)));
            activePolygon.attr('points', newPoints);
            // polygon created and stored
            const rid = randomId();
            objects.push({
              id: `canvas-e-${rid}`,
              type: 'polygon',
              meta: {
                rows: 0,
                rotation: 0,
              },
              data: {
                points: activePolygon.attr('points'),
              },
            });
            confirmNewShape(activePolygon, rid);
          }
          break;
        }
      case 4:
        {
          const activeFbPolygon = canvas.select('polygon.active_fb');
          if (!activeFbPolygon.empty()) {
            let newPoints =
              `${activeFbPolygon.attr('points')} ${coords.join(',')}`;
            newPoints = arrayToPoints(prunePoints(pointsToArray(newPoints)));
            activeFbPolygon.attr('points', newPoints).classed('fb', true);
            // polygon created and stored
            const rid = randomId();
            metaObjects.floor_border = {
              type: 'f_border',
              id: `canvas-e-${rid}`,
              data: {
                points: activeFbPolygon.attr('points'),
              },
            };
            confirmNewShape(activeFbPolygon, rid, {
              readonly: true,
            });
          }
          $('#cfloor-btn-set').removeClass('disabled');
          // re-enable output buttons that are always disabled in setNav
          $('#btn-output-save').removeClass('disabled');
          $('#btn-output-JSON').removeClass('disabled');
          canvas.style('cursor', 'default').selectAll('*').style('cursor',
            'default');
          break;
        }
      default:

    }
  });
}

const rowThickness = 10;

function initStacksInShape(e, rows, rotation) {
  const objIdx = _.findIndex(objects, o => o.id === e.attr('id') && o.type !==
    'stacks');
  objects[objIdx].meta.rows = rows;
  objects[objIdx].meta.rotation = rotation;

  $('#cmark-rows').val(rows);
  $('#cmark-rotation').val(rotation);

  canvas.select(`g[for="${e.attr('id')}"]`).remove();
  const newObjects = [];
  objects.forEach((obj) => {
    if (obj.type !== 'stacks' || obj.id !== e.attr('id')) {
      newObjects.push(obj);
    }
  });
  objects = newObjects;

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
  const stacksData = [];
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

    stacksData.push({
      type: 'stack',
      id: `canvas-e-${rid}`,
      meta: {
        cx: rectCenterRotated[0],
        cy: rectCenterRotated[1],
        lx: centeroidRowLen,
        ly: rowThickness,
        rotation,
        oversize: 0,
        startClass: 'A',
        startSubclass: 0,
        startSubclass2: '',
        endClass: 'Z',
        endSubclass: 0,
        endSubclass2: '',
      },
      data: {
        x: parseFloat(rect.attr('x')),
        y: parseFloat(rect.attr('y')),
        width: parseFloat(rect.attr('width')),
        height: parseFloat(rect.attr('height')),
        rotation: parseFloat(rotation),
      },
    });

    confirmNewShape(rect, rid, {
      stroke: '#0AC',
    });

    rectCenter[1] += (rowThickness + rowSpacing);
  }

  // stacks created and stored
  objects.push({
    type: 'stacks',
    id: e.attr('id'),
    data: stacksData,
  });

  // END initStacksInShape
}

$(document).ready(() => {
  loadLibraries();

  $('.tool-options > .row').hide();
  $('.dropdown-button').dropdown();
  $('#workspace').height($('#workspace').height() - 74);
  initCanvas($('#workspace').width() - 10, $('#workspace').height() - 10);
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
      $('.toolbox a.btn-flat').removeClass('light-blue');
      if (!canvas.selectAll('.selected').empty()) {
        $(`.tool-options > .row:nth-child(${index})`).show();
      }

      // tool options available without selecting an element
      if (modebit === 4) {
        $(`.tool-options > .row:nth-child(${index})`).show();
      }
      $(event.currentTarget).addClass('light-blue');
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
    if (objects.length === 0) {
      return;
    }
    const obj = objects.pop();
    if (obj.type !== 'stacks') {
      $(`#${obj.id}`).remove();
    } else {
      canvas.select(`g[for="${obj.id}"]`).remove();
    }
    objectsRedo.push(obj);
  });

  $('#nav-redo').click(() => {
    if (objectsRedo.length === 0) {
      return;
    }
    const obj = objectsRedo.pop();
    switch (obj.type) {
      case 'rect':
        {
          const rect = canvas.append('rect');
          rect.attrs(obj.data);
          // rect redrawn and restored
          objects.push(obj);
          confirmNewShape(rect, obj.id, {
            redo: true,
          });
          break;
        }
      case 'polygon':
        {
          const polygon = canvas.append('polygon');
          polygon.attrs(obj.data);
          // rect redrawn and restored
          objects.push(obj);
          confirmNewShape(polygon, obj.id, {
            redo: true,
          });
          break;
        }
      case 'stacks':
        {
          const group = canvas.append('g').attr('for', obj.id);
          obj.data.forEach((r) => {
            const rect = group.append('rect').attrs(r.data).classed(
              'cstack', true);
            const rectCenter = [];
            rectCenter[0] = r.data.x + (r.data.width * 0.5);
            rectCenter[1] = r.data.y + (r.data.height * 0.5);
            const transVals = [
              r.data.rotation,
              rectCenter[0],
              rectCenter[1],
            ].join(' ');
            rect.attr('transform', `rotate(${transVals})`);
            confirmNewShape(rect, r.id, {
              stroke: '#0AC',
              redo: true,
            });
          });
          // stacks redrawn and restored
          objects.push(obj);
          break;
        }
      default:

    }
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
    objects = objects.map((obj) => {
      if (obj.id === shape.attr('id') && obj.type !== 'stacks') {
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

    // for stack rect edit
    objects = objects.map((obj) => {
      const stackIdx = _.findIndex(obj.data, {
        id: shape.attr('id'),
      });
      if (obj.type === 'stacks' && stackIdx >= 0) {
        const newObj = _.clone(obj);
        newObj.data[stackIdx].data.x = parseInt(shape.attr('x'), 10);
        newObj.data[stackIdx].data.y = parseInt(shape.attr('y'), 10);
        newObj.data[stackIdx].data.width = parseInt(shape.attr(
          'width'), 10);
        newObj.data[stackIdx].data.height = parseInt(shape.attr(
          'height'), 10);
        // update meta
        newObj.data[stackIdx].meta.cx = newObj.data[stackIdx].data.x +
          (newObj.data[stackIdx].data.width / 2);
        newObj.data[stackIdx].meta.cy = newObj.data[stackIdx].data.y +
          (newObj.data[stackIdx].data.height / 2);
        newObj.data[stackIdx].meta.lx = newObj.data[stackIdx].data.width;
        newObj.data[stackIdx].meta.ly = newObj.data[stackIdx].data.height;

        return newObj;
      }
      return obj;
    });
  });

  $('.row.cpolygon input').change(() => {
    const shape = canvas.selectAll('.selected');
    shape.attr('points', $('#cpolygon-points').val());
  });

  $('.row.cstack input, .row.cstack select').change(() => {
    const shape = canvas.selectAll('.selected');

    objects = objects.map((obj) => {
      const stackIdx = _.findIndex(obj.data, {
        id: shape.attr('id'),
      });
      if (obj.type === 'stacks' && stackIdx >= 0) {
        const newObj = _.clone(obj);
        newObj.data[stackIdx].meta.oversize = parseInt($(
          '#cstack-oversize').val(), 10);
        shape.classed('size0', false).classed('size1', false).classed(
          'size2', false).classed(
          `size${$('#cstack-oversize').val()}`, true);
        newObj.data[stackIdx].meta.startClass = $(
          '#cstack-startClass').val().trim().toUpperCase();
        newObj.data[stackIdx].meta.startSubclass = Math.floor(
          parseFloat($('#cstack-startSubclass').val(), 10));
        newObj.data[stackIdx].meta.startSubclass2 = $(
          '#cstack-startSubclass2').val().trim().toUpperCase();
        newObj.data[stackIdx].meta.endClass = $('#cstack-endClass')
          .val().trim().toUpperCase();
        newObj.data[stackIdx].meta.endSubclass = Math.ceil(
          parseFloat($('#cstack-endSubclass').val(), 10));
        newObj.data[stackIdx].meta.endSubclass2 = $(
          '#cstack-endSubclass2').val().trim().toUpperCase();
        return newObj;
      }
      return obj;
    });
  });

  $('#cfloor-btn-set').click(() => {
    modebit = 4;
    if (metaObjects.floor_border) {
      canvas.select(`polygon[id="${metaObjects.floor_border.id}"]`).remove();
    }
    metaObjects.floor_border = undefined;
    $(event.currentTarget).addClass('disabled');
    canvas.style('cursor', 'crosshair');
  });

  $('#btn-ref-upload').click(() => {
    if ($(event.currentTarget).hasClass('disabled')) {
      return;
    }
    $('#modal-upload-ref > div > form > input[name="floor_id"]').val(
      activeFloor);
    $('.modal').modal();
    $('#modal-upload-ref').modal('open');
  });

  $('#btn-ref-commit-upload').click(() => {
    $.ajax({
      url: '/maps/uploadRefImg',
      type: 'POST',
      data: new FormData($('#modal-upload-ref > div > form')[0]),
      success: (floor) => {
        $('#workspace').css('background-image',
          `url('${floor.ref}')`);
        loadFloors(activeLibrary);
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
    });
  });

  $('.tooltipped').tooltip({
    delay: 50,
  });

  $('select').material_select();

  setNav(false);

  // END $(document).ready
});
