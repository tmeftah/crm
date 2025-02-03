<template>
  <q-page padding>
    <div class="q-pa-md">
      <q-btn
        label="Add New Customer"
        color="primary"
        icon="add"
        class="q-mb-md"
        to="/new"
      />
      <div class="row q-col-gutter-md">
        <div class="col-md-7 col-xs-12">
          <q-table
            title="Customer List"
            :rows="customers"
            :columns="columns"
            row-key="id"
            :pagination="pagination"
          >
            <template v-slot:top-right>
              <q-btn
                color="blue-grey-4"
                icon-right="archive"
                label="Export to csv"
                no-caps
                @click="exportTable"
              />
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="name" :props="props">{{ props.row.name }}</q-td>
                <q-td key="email" :props="props">{{ props.row.email }}</q-td>
                <q-td key="activity" :props="props">{{
                  props.row.activity
                }}</q-td>
                <q-td key="phones" :props="props">
                  <ul>
                    <li v-for="(phone, index) in props.row.phones" :key="index">
                      {{ phone.label }}: {{ phone.number }}
                    </li>
                  </ul>
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn
                    icon="edit"
                    color="primary"
                    size="sm"
                    :to="`/customers/${props.row.id}`"
                    class="q-mr-xs"
                  />
                  <q-btn
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="deleteCustomer(props.row.id)"
                  />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </div>
        <div class="col-md-5 col-xs-12">
          <q-card class="map-container q-pa-md">
            <div class="text-h6">Our leads maps</div>
            <q-card-section>
              <div
                class="map-section"
                ref="map"
                id="map"
                style="height: 400px"
              ></div
            ></q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import { exportFile, useQuasar } from "quasar";
import { ref, computed, onMounted, nextTick } from "vue";
import { useLeadStore } from "../stores/leadStore";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import Point from "ol/geom/Point";
import { Icon, Style } from "ol/style";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

export default {
  setup() {
    const $q = useQuasar();
    const leadStore = useLeadStore();

    onMounted(() => {
      leadStore.loadLeadsFromLocalStorage();
    });

    const customers = computed(() => leadStore.leads);
    const mapElement = ref(null);

    const columns = [
      {
        name: "name",
        label: "Name",
        align: "left",
        field: "name",
        sortable: true,
      },
      {
        name: "email",
        label: "Email",
        align: "left",
        field: "email",
        sortable: true,
      },
      {
        name: "activity",
        label: "Domain of Activity",
        align: "left",
        field: "activity",
        sortable: true,
      },
      {
        name: "phones",
        label: "Phone Numbers",
        align: "left",
        field: "phones",
      },
      { name: "actions", label: "Actions", align: "right", field: "actions" },
    ];

    const pagination = ref({
      sortBy: "name",
      descending: false,
      page: 1,
      rowsPerPage: 10,
    });

    const vectorSource = new VectorSource();

    let map;

    // Once the DOM is ready, set the map target
    nextTick(() => {
      map = new Map({
        target: "map",
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          new VectorLayer({
            source: vectorSource,
          }),
        ],
        view: new View({
          center: fromLonLat([9.0, 35.0]), // Center on Tunisia
          zoom: 6.5, // Set an appropriate zoom level to see Tunisia
        }),
      });
      displayMarkers();
    });

    const deleteCustomer = (id) => {
      leadStore.deleteLead(id);
      displayMarkers();
    };

    const displayMarkers = () => {
      vectorSource.clear(); // Clear existing markers
      customers.value.forEach((customer) => {
        if (customer.location) {
          const [lat, lon] = customer.location.split(", ").map(Number);
          const marker = new Feature({
            geometry: new Point(fromLonLat([lon, lat])),
          });

          const iconStyle = new Style({
            image: new Icon({
              anchor: [0.5, 1],
              src: " ./marker.png",

              scale: 0.3,
            }),
          });

          marker.setStyle(iconStyle);
          vectorSource.addFeature(marker);
        }
      });
    };

    const wrapCsvValue = (val, formatFn, row) => {
      let formatted = formatFn !== void 0 ? formatFn(val, row) : val;

      // Convert objects to formatted key-value strings
      if (typeof formatted === "object" && formatted !== null) {
        try {
          if (Array.isArray(formatted)) {
            // Assuming val is an array of objects, as in the provided example
            formatted = formatted
              .map((item) =>
                Object.entries(item)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(" - ")
              )
              .join(" / ");
          } else {
            // If it's a single object
            formatted = Object.entries(formatted)
              .map(([key, value]) => `${key}: ${value}`)
              .join(" - ");
          }
        } catch (error) {
          console.error("Error processing object:", error);
          formatted = ""; // Fallback to empty string or handle error as needed
        }
      }

      formatted =
        formatted === void 0 || formatted === null ? "" : String(formatted);

      formatted = formatted.split('"').join('""');
      /**
       * Excel accepts \n and \r in strings, but some other CSV parsers do not
       * Uncomment the next two lines to escape new lines
       */
      // .split('\n').join('\\n')
      // .split('\r').join('\\r')

      return `"${formatted}"`;
    };
    const exportTable = () => {
      // Filter out columns with the name 'ACTION'
      const exportableColumns = columns.filter((col) => col.name !== "actions");

      // Naive encoding to CSV format
      const content = [exportableColumns.map((col) => wrapCsvValue(col.label))]
        .concat(
          customers.value.map((row) =>
            exportableColumns
              .map((col) =>
                wrapCsvValue(
                  typeof col.field === "function"
                    ? col.field(row)
                    : row[col.field === undefined ? col.name : col.field],
                  col.format,
                  row
                )
              )
              .join(",")
          )
        )
        .join("\r\n");

      const status = exportFile("table-export.csv", content, "text/csv");

      if (status !== true) {
        $q.notify({
          message: "Browser denied file download...",
          color: "negative",
          icon: "warning",
        });
      } else {
        $q.notify({
          message: "Export successfully.",
          color: "positive",
          icon: "done",
        });
      }
    };

    return {
      customers,
      columns,
      pagination,
      deleteCustomer,
      mapElement,
      wrapCsvValue,
      exportTable,
    };
  },
};
</script>

<style scoped>
.container {
  display: flex;
  height: 100vh;
}

.table-section {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.map-section {
  flex: 1;
  height: 100%;

  overflow: hidden;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 4px;
}

#map {
  width: 100%;
  height: 100%;
}
</style>
