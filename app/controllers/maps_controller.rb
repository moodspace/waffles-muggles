# waffles-muggles
#
# CS 5150 Navigation in Library Stacks.
#
# Controller to render maps
#
class MapsController < ApplicationController
    layout "application"

    def show
        @callno = params[:callno]
        @libid = params[:library_id]
        render 'maps/full'
    end
end
