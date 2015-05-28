fluid.defaults("ctr.config.root", {
    gradeNames: ["fluid.littleComponent", "autoInit"],
    distributeOptions: [{
        target: "{that baseUrlAware}.options.baseUrl",
        source: "{that}.options.serverConfig.baseUrl"
    }
    ]
});