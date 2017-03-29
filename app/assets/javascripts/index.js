let callNo;
let libId;
const mapPath = '#map-popup > div > div > div.modal-body';
let mapCtx;

function updateStack(s) {
  $(`${mapPath} #text-floor-id`).html(
    `<h1>${s.library.name} <small>${s.floor.name}</small></h1>`);
  $(`${mapPath} #text-stack-id`).text(`Stack ${s.id}`);
  $(`${mapPath} #text-stack-range`).text(
    `${s.startClass}${s.startSubclass || ''} ${s.startSubclass2 || ''}
    - ${s.endClass}${s.endSubclass || ''} ${s.endSubclass2 || ''}`,
  );
}

function drawFloor(size, w, h, json) {
  const geojson = JSON.parse(json);

  mapCtx.beginPath();
  mapCtx.rect(size.scaleX(0), size.scaleY(0), size.scale(w), size.scale(h));
  mapCtx.closePath();
  mapCtx.fillStyle = '#E4E4E4';
  mapCtx.fill();
  mapCtx.lineWidth = 3;
  mapCtx.strokeStyle = '#B1BBBC';
  mapCtx.stroke();

  mapCtx.beginPath();
  mapCtx.moveTo(size.scaleX(geojson.coordinates[0][0]), size.scaleY(geojson.coordinates[
    0][1]));
  geojson.coordinates.forEach((coords) => {
    mapCtx.lineTo(size.scaleX(coords[0]), size.scaleY(coords[1]));
  });
  mapCtx.closePath();
  mapCtx.stroke();
}

function drawStack(size, stack, highlighted) {
  mapCtx.translate(size.scaleX(stack.cx), size.scaleY(stack.cy));
  mapCtx.rotate((stack.rotation * Math.PI) / 180);
  mapCtx.beginPath();
  mapCtx.rect(-size.scale(stack.lx) * 0.5, -size.scale(stack.ly) * 0.5, size.scale(
    stack.lx), size.scale(stack.ly));
  mapCtx.closePath();
  mapCtx.fillStyle = highlighted ?
    'red' :
    '#FAF5ED';
  mapCtx.fill();
  mapCtx.lineWidth = 1;
  mapCtx.strokeStyle = 'black';
  mapCtx.stroke();
  mapCtx.rotate((-stack.rotation * Math.PI) / 180);
  mapCtx.translate(-size.scaleX(stack.cx), -size.scaleY(stack.cy));
}

function loadMap(stackId) {
  $.ajax({
    url: `/v1/stacks/${stackId}`, // Route to the Script Controller method
    type: 'GET',
    success: (s) => {
      const canvasW = $('#map-canvas').parent().innerWidth();
      const canvasH = $(window).height() * 0.6;

      $('#map-canvas').attr('width', canvasW);
      $('#map-canvas').attr('height', canvasH);
      const scale = Math.min(canvasW / s.floor.size_x, canvasH / s.floor.size_y);
      const mapScales = {
        width: canvasW,
        height: canvasH,
        scale: v => scale * v,
        scaleX: v => ((canvasW * 0.5) - (scale * s.floor.size_x * 0.5)) +
          (scale * v),
        scaleY: v => ((canvasH * 0.5) - (scale * s.floor.size_y * 0.5)) +
          (scale * v),
      };
      drawFloor(mapScales, s.floor.size_x, s.floor.size_y, s.floor
        .geojson);
      updateStack(s);
      $.ajax({
        url: `/v1/stacks?floor_id=${s.floor.id}`, // Route to the Script Controller method
        type: 'GET',
        success: (allStacks) => {
          allStacks.forEach((stack) => {
            drawStack(mapScales, stack, stack.id === s.id);
          });
        },
      });
    },
  });
}

function searchItem(callback) {
  $.ajax({
    url: '/v1/search', // Route to the Script Controller method
    type: 'GET',
    dataType: 'json',
    data: {
      keyword: callNo,
    },
    success: (data) => {
      let found = false;
      data.forEach((searchResult) => {
        if (!found && searchResult.result.library.id ===
          libId) {
          loadMap(searchResult.result_id);
          found = true;
          callback();
        }
      });
    },
    error: (e) => {
      callback(e.responseJSON);
    },
  });
}

function showModal(e) {
  if (!e) {
    $('#map-popup .modal-title').text('');
    $('#map-popup .modal-body > div').show();
  } else {
    $('#map-popup .modal-title').text(e.message);
    $('#map-popup .modal-body > div').hide();
  }
  $('#map-popup').modal('show');
}

$(document).ready(() => {
  mapCtx = $(`${mapPath} canvas`)[0].getContext('2d');
  $('#btn-book-find').click(() => {
    callNo = $('#call-number').val();
    libId = parseInt($('#library-id').val(), 10);
    searchItem(showModal);
  });
});
