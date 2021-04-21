const Item = require('../models/Item')
const Token = require('../models/Token')

const crypto = require('crypto');
const nodemailer = require('nodemailer')

const config = require('../config/config')

module.exports = {
    async projectsLastYear(req, res) {
        try {
            const projects = await Item.find({
                owner: req.user.id,
                project: true
            })

            let januaryCount = 0;
            let februaryCount = 0;
            let marchCount = 0;
            let aprilCount = 0;
            let mayCount = 0;
            let juneCount = 0;
            let julyCount = 0;
            let augustCount = 0;
            let septemberCount = 0;
            let octoberCount = 0;
            let novemberCount = 0;
            let decemberCount = 0;

            const currentYear = new Date().getFullYear()

            const january = new Date(currentYear, 01, 1)
            const february = new Date(currentYear, 02, 1)
            const march = new Date(currentYear, 03, 1)
            const april = new Date(currentYear, 04, 1)
            const may = new Date(currentYear, 05, 1)
            const june = new Date(currentYear, 06, 1)
            const july = new Date(currentYear, 07, 1)
            const august = new Date(currentYear, 08, 1)
            const september = new Date(currentYear, 09, 1)
            const october = new Date(currentYear, 10, 1)
            const november = new Date(currentYear, 11, 1)
            const december = new Date(currentYear, 12, 1)
            const lastDecember = new Date((currentYear - 1), 12, 1)

            projects.forEach(project => {
                if (project.dateAdd > january && project.dateAdd < february) {
                    februaryCount += 1
                } else if (project.dateAdd > february && project.dateAdd < march) {
                    marchCount += 1
                } else if (project.dateAdd > march && project.dateAdd < april) {
                    aprilCount += 1
                } else if (project.dateAdd > april && project.dateAdd < may) {
                    mayCount += 1
                } else if (project.dateAdd > may && project.dateAdd < june) {
                    juneCount += 1
                } else if (project.dateAdd > june && project.dateAdd < july) {
                    julyCount += 1
                } else if (project.dateAdd > july && project.dateAdd < august) {
                    augustCount += 1
                } else if (project.dateAdd > august && project.dateAdd < september) {
                    septemberCount += 1
                } else if (project.dateAdd > september && project.dateAdd < october) {
                    octoberCount += 1
                } else if (project.dateAdd > october && project.dateAdd < november) {
                    novemberCount += 1
                } else if (project.dateAdd > november && project.dateAdd < december) {
                    decemberCount += 1
                } else if (project.dateAdd > lastDecember && project.dateAdd < january) {
                    januaryCount += 1
                }
            })

            const projectCreatedData = [januaryCount, februaryCount, marchCount, aprilCount, mayCount, juneCount, julyCount, augustCount, septemberCount, octoberCount, novemberCount, decemberCount]

            const data = {
                type: "line",
                data: {
                    labels: [
                        "Januar",
                        "Februar",
                        "Marec",
                        "April",
                        "Maj",
                        "Junij",
                        "Julij",
                        "Avgust",
                        "September",
                        "Oktober",
                        "November",
                        "December",
                    ],
                    datasets: [{
                        label: "Projekti",
                        backgroundColor: "#8ab6d6",
                        data: projectCreatedData,
                    }, ],
                },

                options: {
                    responsive: true,
                    lineTension: 0,
                    borderWidth: 4,
                    borderCapStyle: "round",
                    borderJoinStyle: "bevel",
                    spanGaps: true,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                padding: 25,
                            },
                        }, ],
                    },
                },
            }

            res.json({
                chartData: data,
            })

        } catch (error) {
            res.json({
                error: "error"
            })
        }
    },
    async joinedProjectsLastYear(req, res) {
        try {
            const projects = await Item.find({
                users: req.user.id,
                project: true
            })

            let januaryCount = 0;
            let februaryCount = 0;
            let marchCount = 0;
            let aprilCount = 0;
            let mayCount = 0;
            let juneCount = 0;
            let julyCount = 0;
            let augustCount = 0;
            let septemberCount = 0;
            let octoberCount = 0;
            let novemberCount = 0;
            let decemberCount = 0;

            const currentYear = new Date().getFullYear()

            const january = new Date(currentYear, 01, 1)
            const february = new Date(currentYear, 02, 1)
            const march = new Date(currentYear, 03, 1)
            const april = new Date(currentYear, 04, 1)
            const may = new Date(currentYear, 05, 1)
            const june = new Date(currentYear, 06, 1)
            const july = new Date(currentYear, 07, 1)
            const august = new Date(currentYear, 08, 1)
            const september = new Date(currentYear, 09, 1)
            const october = new Date(currentYear, 10, 1)
            const november = new Date(currentYear, 11, 1)
            const december = new Date(currentYear, 12, 1)
            const lastDecember = new Date((currentYear - 1), 12, 1)


            projects.forEach(project => {
                if (project.dateAdd > january && project.dateAdd < february) {
                    februaryCount += 1
                } else if (project.dateAdd > february && project.dateAdd < march) {
                    marchCount += 1
                } else if (project.dateAdd > march && project.dateAdd < april) {
                    aprilCount += 1
                } else if (project.dateAdd > april && project.dateAdd < may) {
                    mayCount += 1
                } else if (project.dateAdd > may && project.dateAdd < june) {
                    juneCount += 1
                } else if (project.dateAdd > june && project.dateAdd < july) {
                    julyCount += 1
                } else if (project.dateAdd > july && project.dateAdd < august) {
                    augustCount += 1
                } else if (project.dateAdd > august && project.dateAdd < september) {
                    septemberCount += 1
                } else if (project.dateAdd > september && project.dateAdd < october) {
                    octoberCount += 1
                } else if (project.dateAdd > october && project.dateAdd < november) {
                    novemberCount += 1
                } else if (project.dateAdd > november && project.dateAdd < december) {
                    decemberCount += 1
                } else if (project.dateAdd > lastDecember && project.dateAdd < january) {
                    januaryCount += 1
                }
            })

            const projectCreatedData = [januaryCount, februaryCount, marchCount, aprilCount, mayCount, juneCount, julyCount, augustCount, septemberCount, octoberCount, novemberCount, decemberCount]

            const data = {
                type: "line",
                data: {
                    labels: [
                        "Januar",
                        "Februar",
                        "Marec",
                        "April",
                        "Maj",
                        "Junij",
                        "Julij",
                        "Avgust",
                        "September",
                        "Oktober",
                        "November",
                        "December",
                    ],
                    datasets: [{
                        label: "Projekti",
                        backgroundColor: "#8ab6d6",
                        data: projectCreatedData,
                    }, ],
                },

                options: {
                    responsive: true,
                    lineTension: 0,
                    borderWidth: 4,
                    borderCapStyle: "round",
                    borderJoinStyle: "bevel",
                    spanGaps: true,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                padding: 25,
                            },
                        }, ],
                    },
                },
            }

            res.json({
                chartData: data,
                lastProject: projects[projects.length - 1]
            })

        } catch (error) {
            res.json({
                error: "error"
            })
        }
    }
}