// WidgetWrapper Component - Add this near the top of Dashboard component

interface WidgetWrapperProps {
    widgetId: string;
    children: React.ReactNode;
    className?: string;
    draggedWidget: string | null;
    dragOverWidget: string | null;
    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (id: string) => void;
    onDrop: (e: React.DragEvent, id: string) => void;
}

const WidgetWrapper: React.FC<WidgetWrapperProps> = ({
    widgetId,
    children,
    className = '',
    draggedWidget,
    dragOverWidget,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDrop
}) => {
    const isDragging = draggedWidget === widgetId;
    const isDragOver = dragOverWidget === widgetId;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, widgetId)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragEnter={() => onDragEnter(widgetId)}
            onDrop={(e) => onDrop(e, widgetId)}
            className={`${className} ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-primary' : ''
                } cursor-move relative group transition-all`}
        >
            {/* Drag Handle Indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-surface-dark/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border-dark pointer-events-none">
                <span className="material-icons-outlined text-sm text-subtext-dark">
                    drag_indicator
                </span>
            </div>
            {children}
        </div>
    );
};

// USAGE EXAMPLE:
// Instead of:
// <div className="col-span-1 bg-surface-dark p-6 rounded-2xl">
//   Widget content
// </div>

// Use:
// <WidgetWrapper
//   widgetId="widgetName"
//   className="col-span-1 bg-surface-dark p-6 rounded-2xl"
//   draggedWidget={draggedWidget}
//   dragOverWidget={dragOverWidget}
//   onDragStart={handleDragStart}
//   onDragEnd={handleDragEnd}
//   onDragOver={handleDragOver}
//   onDragEnter={handleDragEnter}
//   onDrop={handleDrop}
// >
//   Widget content
// </WidgetWrapper>
