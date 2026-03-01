/**
 * DOM操作関連のユーティリティ
 */

export async function setupDraggable(modalElement, handleElement) {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    const onMouseDown = (e) => {
        isDragging = true;
        const rect = modalElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
    };

    const onMouseMove = (e) => {
        if (!isDragging) return;
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const rect = modalElement.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        modalElement.style.right = 'auto';
        modalElement.style.bottom = 'auto';
        modalElement.style.left = `${newX}px`;
        modalElement.style.top = `${newY}px`;
    };

    const onMouseUp = () => { isDragging = false; };

    handleElement.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    this.cleanupCallbacks.push(() => {
        handleElement.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    });
}
