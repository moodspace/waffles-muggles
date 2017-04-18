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
        startClass: stack.start_class,
        startSubclass: stack.start_subclass,
        startSubclass2: stack.start_subclass2,
        endClass: stack.end_class,
        endSubclass: stack.end_subclass,
        endSubclass2: stack.end_subclass2,
        oversize: stack.oversize,
        floor: {
          id: floor.id
        },
        library: {
          id: library.id
        }
      }
    end

    def getStackById(stackId)
      getStack(Stack.find(stackId))
    end
  end
end
