# waffles-muggles
#
# CS 5150 Navigation in Library Stacks.
#
# OpenAPI spec version: 1.0.0
#
# Generated by: https://github.com/swagger-api/swagger-codegen.git
#
class FloorsController < ApplicationController
  def index
    ret = []
    Floor.find_each do |floor|
      if floor.library == params[:library_id].to_i
        library = Library.find(floor.library)
        ret << {
          id: floor.id,
          name: floor.name,
          size_x: floor.size_x,
          size_y: floor.size_y,
          geojson: floor.geojson,
          map: params[:more] ? floor.map : '',
          ref: floor.ref,
          library: {
            id: library.id,
            name: library.name,
            latitude: library.latitude,
            longitude: library.longitude
          }
        }
      end
    end
    render json: ret
  end

  def destroy
    Floor.find(params[:id]).destroy
    render json: 'OK'.to_json
  end

  def show
    floor = Floor.find(params[:id])
    library = Library.find(floor.library)

    render json: {
      id: floor.id,
      name: floor.name,
      size_x: floor.size_x,
      size_y: floor.size_y,
      geojson: floor.geojson,
      map: params[:more] ? floor.map : '',
      ref: floor.ref,
      library: {
        id: library.id,
        name: library.name,
        latitude: library.latitude,
        longitude: library.longitude
      }
    }
  end

  def create
    floor = Floor.new
    floor.name = params[:name]
    floor.size_x = params[:size_x]
    floor.size_y = params[:size_y]
    floor.geojson = params[:geojson]
    floor.map = params[:map]
    floor.ref = params[:ref]
    floor.library = params[:library]
    if floor.save
      render json: floor.id.to_json
    else
      render json: { error: 'bad request', code: 400, message: 'unable to create record' }, status: 400
    end
  end

  def floors_put
    floor = Floor.find(params[:id])
    floor.name = params[:name] || floor.name
    floor.size_x = params[:size_x] || floor.size_x
    floor.size_y = params[:size_y] || floor.size_y
    floor.geojson = params[:geojson] || floor.geojson
    floor.map = params[:map] || floor.map
    oldRef = floor.ref
    floor.ref = params[:ref] || floor.ref
    floor.library = params[:library] || floor.library
    if params[:ref] && oldRef != params[:ref]
      if oldRef && oldRef.end_with?('.png') && File.exist?(Rails.root.join('public', oldRef))
        File.delete(Rails.root.join('public', oldRef))
      end
    end
    if floor.save
      render json: 'OK'.to_json
    else
      render json: { error: 'bad request', code: 400, message: 'unable to update record' }, status: 400
    end
  end
end
