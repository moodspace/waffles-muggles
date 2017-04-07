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
    if params[:ref_img]
      uploaded_io = params[:ref_img]
      image = MiniMagick::Image.open(uploaded_io.tempfile.path)
    else
      image = MiniMagick::Image.open('app/assets/images/blank.png')
      image.resize "#{params[:width]}x#{params[:height]}!"
    end
    image.format 'png'

    md5 = Digest::MD5.new
    md5 << image.to_blob
    md5 << Time.new.to_s
    md5digest = md5.hexdigest
    fn = Rails.root.join('public', 'uploads/ref', md5digest)
    image.write "#{fn}.png"

    render json: {
      ref: "uploads/ref/#{md5digest}.png",
      w: image.width,
      h: image.height
    }
  end
end
