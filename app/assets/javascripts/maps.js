let mapCtx;
let bibData;

function drawFloor(size, w, h, json) {
  const geojson = JSON.parse(json);

  mapCtx.beginPath();
  mapCtx.rect(size.scaleX(0), size.scaleY(0), size.scale(w), size.scale(h));
  mapCtx.closePath();
  mapCtx.fillStyle = '#F4F2EF';
  mapCtx.fill();
  mapCtx.lineWidth = 1;
  mapCtx.strokeStyle = 'black';
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

function updateStack(s) {
  $('#text-stack-id').text(
    `${s.library.name} ${s.floor.name} Stack ${s.id}`);
  $('#text-stack-range').text(
    `${s.startClass}${s.startSubclass} - ${s.endClass}${s.endSubclass}`);
  $('#text-stack-topic').text('LOL');
  $('#text-stack-topic-more').text('LOLOLOL');
}


function loadMap(stackId) {
  $.ajax({
    url: `/v1/stacks/${stackId}`, // Route to the Script Controller method
    type: 'GET',
    success: (s) => {
      const canvasW = $('#map-wrapper > .floor-map-wrapper').innerWidth();
      let canvasH = $('#map-wrapper').innerHeight();
      if ($('#map-wrapper > .floor-map-wrapper').position().top > 50) {
        canvasH -= $('#map-wrapper > .stack-box-wrapper').innerHeight();
      }

      $('#map-canvas').attr('width', canvasW);
      $('#map-canvas').attr('height', canvasH);
      mapCtx = $('#map-canvas')[0].getContext('2d');
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

function loadHoldings() {
  $.ajax({
    url: `https://holdings4.library.cornell.edu/holdings/retrieve_detail_raw/${bibId}`,
    type: 'GET',
    success: (data) => {
      bibData = data;
    },
  });
}

$(document).ready(() => {
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
        }
      });
    },
    error: (req, status, e) => {
      console.log(status)
    },
  });

  if (bibId) {
    loadHoldings();
  }
});
