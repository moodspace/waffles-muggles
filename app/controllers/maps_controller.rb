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
        prng = Random.new

        @callno = params[:callno]
        @bibid = params[:bibid].to_i == 0 ? 'undefined' : params[:bibid].to_i
        @libid = params[:library_id].to_i == 0 ? 'undefined' : params[:library_id].to_i
        render 'maps/full'
    end
end
