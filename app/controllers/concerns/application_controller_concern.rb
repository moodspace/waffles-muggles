module ApplicationControllerConcern
    extend ActiveSupport::Concern

    included do
        def getStack(stack)
            floor = Floor.find(stack.floor)
            library = Library.find(floor.library)
            {
                id: stack.id,
                cx: stack.cx,
                cy: stack.cy,
                lx: stack.lx,
                ly: stack.ly,
                rotation: stack.rotation,
                geojson: stack.geojson,
                startClass: stack.start_class,
                startSubclass: stack.start_subclass,
                endClass: stack.end_class,
                endSubclass: stack.end_subclass,
                oversize: stack.oversize,
                floor: {
                    id: floor.id,
                    name: floor.name,
                    size_x: floor.size_x,
                    size_y: floor.size_y,
                    geojson: floor.geojson
                },
                library: {
                    id: library.id,
                    name: library.name,
                    latitude: library.latitude,
                    longitude: library.longitude
                }
            }
        end

        def getStackById(stackId)
            getStack(Stack.find(stackId))
        end
    end
end
