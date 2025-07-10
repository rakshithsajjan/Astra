/* imports common modules */

const { contextBridge, ipcRenderer } = require('electron');

var propertiesToClone = ['deltaX', 'deltaY', 'metaKey', 'ctrlKey', 'defaultPrevented', 'clientX', 'clientY']

function cloneEvent (e) {
  var obj = {}

  for (var i = 0; i < propertiesToClone.length; i++) {
    obj[propertiesToClone[i]] = e[propertiesToClone[i]]
  }
  return JSON.stringify(obj)
}

// workaround for Electron bug
setTimeout(function () {
  /* Used for swipe gestures */
  window.addEventListener('wheel', function (e) {
    ipcRenderer.send('wheel-event', cloneEvent(e))
  })

  var scrollTimeout = null

  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout)
    scrollTimeout = setTimeout(function () {
      ipcRenderer.send('scroll-position-change', Math.round(window.scrollY))
    }, 200)
  })
}, 0)

/* Used for picture in picture item in context menu */
ipcRenderer.on('getContextMenuData', function (event, data) {
  // check for video element to show picture-in-picture menu
  var hasVideo = Array.from(document.elementsFromPoint(data.x, data.y)).some(el => el.tagName === 'VIDEO')
  ipcRenderer.send('contextMenuData', { hasVideo })
})

ipcRenderer.on('enterPictureInPicture', function (event, data) {
  var videos = Array.from(document.elementsFromPoint(data.x, data.y)).filter(el => el.tagName === 'VIDEO')
  if (videos[0]) {
    videos[0].requestPictureInPicture()
  }
})

window.addEventListener('message', function (e) {
  if (!e.origin.startsWith('min://')) {
    return
  }

  if (e.data?.message === 'showCredentialList') {
    ipcRenderer.send('showCredentialList')
  }

  if (e.data?.message === 'showUserscriptDirectory') {
    ipcRenderer.send('showUserscriptDirectory')
  }

  if (e.data?.message === 'downloadFile') {
    ipcRenderer.send('downloadFile', e.data.url)
  }
})

contextBridge.exposeInMainWorld('minAPI', {
  getTabInfo: () => {
    try {
      return {
        tasks: window.tasks,
        tabs: window.tabs
      };
    } catch (e) {
      console.error('Error getting tab info:', e);
      return null;
    }
  }
});
