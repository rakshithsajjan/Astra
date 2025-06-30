const aiSidebar = require('aiSidebar.js')

var toggleBtn = document.getElementById('ai-sidebar-toggle-button')

function initialize () {
  if (!toggleBtn) {
    return
  }
  toggleBtn.addEventListener('click', function () {
    aiSidebar.toggle()
  })
}

module.exports = { initialize } 