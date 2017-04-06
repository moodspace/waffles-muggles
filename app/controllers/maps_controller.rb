# waffles-muggles
#
# CS 5150 Navigation in Library Stacks.
#
# Controller to render maps
#
class MapsController < ApplicationController
  include HTTParty

  layout 'bootstrap'

  def show
    @callno = params[:callno]
    @bibid = params[:bibid].to_i == 0 ? 'undefined' : params[:bibid].to_i
    @libid = params[:library_id].to_i == 0 ? 'undefined' : params[:library_id].to_i
    render 'maps/full'
  end

  def upload_ref
    uploaded_io = params[:ref_img]
    image = MiniMagick::Image.open(uploaded_io.tempfile.path)
    image.path
    image.format 'png'

    md5 = Digest::MD5.new
    md5 << image.to_blob
    md5 << Time.new.to_s
    md5digest = md5.hexdigest
    fn = Rails.root.join('public', 'uploads/ref', md5digest)
    image.write "#{fn}.png"

    floor = Floor.find(params[:floor_id])
    if floor.ref && floor.ref.end_with?('.png') && File.exists?(Rails.root.join('public', floor.ref))
      File.delete(Rails.root.join('public', floor.ref))
    end
    floor.ref = "uploads/ref/#{md5digest}.png"

    if floor.save
      library = Library.find(floor.library)
      render json: {
        id: floor.id,
        name: floor.name,
        size_x: floor.size_x,
        size_y: floor.size_y,
        geojson: floor.geojson,
        stackmap: floor.stackmap,
        ref: floor.ref,
        library: {
          id: library.id,
          name: library.name,
          latitude: library.latitude,
          longitude: library.longitude
        }
      }
    else
      File.delete("#{fn}.png")
      render json: {error: 'bad request', code: 400, message: 'unable to update record'}, status: 400
    end
  end
end
