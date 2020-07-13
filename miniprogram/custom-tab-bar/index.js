Component({
  data: {
    selected: 0,
    color: "#595959",
    selectedColor: "#0197c2",
    list: wx.$initTab(undefined)
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      console.log(data, this)
      wx.$initTab(this);
      wx.switchTab({url})
    },
    attached() {
    },
  }
})