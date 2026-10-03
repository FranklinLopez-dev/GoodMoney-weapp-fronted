import { Component, effect, inject } from "@angular/core";
import { NgApexchartsModule } from "ng-apexcharts";
import { ApexOptions } from "apexcharts";
import { DashboardStore } from "../../store/dashboard.store";
import { MaterialModule } from "src/app/material.module";
import { UtilsService } from "src/app/core/services/common/utils.service";

@Component({
    selector: 'dashboard-exchange-rate',
    standalone: true,
    imports: [NgApexchartsModule, MaterialModule],
    templateUrl: './exchange-rate.component.html'
})
export class ExchangeRateComponent {
    private store = inject(DashboardStore);
    public appData = inject(UtilsService);

    public series: ApexAxisChartSeries = [];

    // Etiquetas y monedas como el mockup (frame 440): compras en PEN, ventas en USD.
    stats: any[] = [
        {
            id: 1,
            title: 'PEN S/ 0.00',
            subtitle: 'Total de Compras',
            enabled: true
        },
        {
            id: 2,
            title: 'USD $ 0.00',
            subtitle: 'Total de Ventas',
            enabled: true
        },
        {
            id: 3,
            title: this.getusers(),
            subtitle: 'Total de Usuarios',
            enabled: false
        },
    ];

    getBuysAmount() {
        const buys = this.store.kpiCompras() || [];
        if (buys.length === 0) return 0;

        return buys.reduce((sum, item) => sum + item.amount, 0);
    }

    getSalesAmount() {
        const buys = this.store.kpiVentas() || [];
        if (buys.length === 0) return 0;

        return buys.reduce((sum, item) => sum + item.amount, 0);
    }

    getusers() {
        const buys = this.store.kpiUsers() || [];
        if (buys.length === 0) return 0;

        return buys.reduce((sum, item) => sum + item.amount, 0);
    }

    public chartOptions: Partial<ApexOptions> | any = {
        chart: {
            type: 'line',
            height: 320,
            toolbar: { show: false }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        markers: {
            size: 4
        },
        xaxis: {
            type: 'datetime',
            labels: {
                format: 'dd/MM'
            }
        },
        yaxis: {
            labels: {
                formatter: (v: number) => `S/ ${v.toFixed(3)}`
            }
        },
        tooltip: {
            x: { format: 'dd/MM/yyyy' },
            y: {
                formatter: (v: number) => `S/ ${v.toFixed(4)}`
            }
        },
        legend: {
            position: 'top'
        },
        // Compra azul, venta verde claro: en verde/amarillo de tema las dos líneas se confundían con la marca.
        colors: ["#2156F0", "#9AE238"],
    };

    constructor() {
        effect(() => {
            const rates = this.store.exchangeRates();
            this.stats[0].title = 'PEN S/ ' + this.getBuysAmount().toFixed(2);
            this.stats[1].title = 'USD $ ' + this.getSalesAmount().toFixed(2);
            this.stats[2].title = this.getusers();
            this.stats[2].enabled = this.store.isAdmin();

            if (!rates?.length) return;

            this.series = [
                {
                    name: 'Compra',
                    data: rates.map(x => ({
                        x: new Date(x.dateRegister).getTime(),
                        y: x.priceCompra
                    }))
                },
                {
                    name: 'Venta',
                    data: rates.map(x => ({
                        x: new Date(x.dateRegister).getTime(),
                        y: x.priceVenta
                    }))
                }
            ];
        });
    }
}