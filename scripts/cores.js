const PerfCore = global.PerfCore;
let monoquark = extend(CoreBlock, "exzory", {
  load(){
    this.super$load()
    this.fullIconRegion = PerfCore.region(this.name + "-full");
  },
  icons(){
    return [
      this.fullIconRegion
    ];
  }
});