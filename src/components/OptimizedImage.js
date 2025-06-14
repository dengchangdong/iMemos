import { html } from 'hono/html'

export function OptimizedImage({ 
  src, 
  alt = '图片', 
  aspectRatio = 'aspect-video',
  className = '',
  loading = 'lazy'
}) {
  return html`
    <div class="relative ${aspectRatio} bg-blue-50/30 dark:bg-gray-700/30 rounded-lg overflow-hidden group">
      <img 
        src="${src}" 
        alt="${alt}"
        class="rounded-lg w-full h-full object-cover hover:opacity-95 transition-opacity absolute inset-0 z-10 ${className}"
        loading="${loading}"
        data-preview="true"
        onerror="this.onerror=null; this.classList.add('hidden'); this.nextElementSibling.classList.remove('hidden');"
      />
      <div class="absolute inset-0 flex items-center justify-center text-blue-400 dark:text-blue-300 opacity-100 transition-opacity duration-300 image-placeholder">
        <i class="ri-image-line text-3xl"></i>
      </div>
      <div class="absolute inset-0 flex items-center justify-center text-red-400 dark:text-red-300 opacity-0 transition-opacity duration-300 image-error hidden">
        <i class="ri-error-warning-line text-3xl"></i>
      </div>
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 cursor-pointer" 
           onclick="previewImage(this.previousElementSibling.previousElementSibling.src)">
      </div>
    </div>
  `
}

// 添加预览功能的脚本
export const previewScript = html`
  <script>
    function previewImage(src) {
      if (!src) return;
      
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black/80 z-50 flex items-center justify-center';
      modal.onclick = () => modal.remove();
      
      const img = document.createElement('img');
      img.src = src;
      img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
      
      modal.appendChild(img);
      document.body.appendChild(modal);
    }
  </script>
` 