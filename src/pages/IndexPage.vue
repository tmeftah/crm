<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row q-col-gutter-md">
        <!-- Form Card -->
        <div class="col-md-8 col-xs-12">
          <q-card class="form-card q-my-md q-pa-md">
            <q-card-section>
              <div class="text-h6">
                {{ isEditing ? "Update Lead" : "Add New Lead" }}
              </div>
              <p>
                {{
                  isEditing
                    ? "Update the details below to modify the lead."
                    : "Fill in the details below to create a new lead."
                }}
              </p>
            </q-card-section>

            <q-form
              ref="leadForm"
              @submit.prevent="onSubmit"
              @reset="resetForm"
            >
              <q-card-section>
                <q-input
                  filled
                  v-model="lead.name"
                  label="Full Name"
                  :rules="[(val) => !!val || 'Name is required']"
                  prepend="person"
                />

                <q-input
                  filled
                  v-model="lead.email"
                  label="Email"
                  :rules="[
                    (val) => !!val || 'Email is required',
                    (val) => /.+@.+\..+/.test(val) || 'Email must be valid',
                  ]"
                  prepend="email"
                />

                <q-select
                  filled
                  v-model="lead.activity"
                  label="Domains of Activity"
                  :options="domains"
                  map-options
                  option-label="label"
                  option-value="value"
                  :rules="[(val) => !!val || 'Domain of activity is required']"
                  prepend="work"
                />

                <!-- Phone Section -->
                <div
                  v-for="(phone, index) in lead.phones"
                  :key="index"
                  class="phone-section q-my-md"
                >
                  <q-input
                    filled
                    v-model="phone.label"
                    label="Phone Label"
                    placeholder="e.g., Home, Work"
                    class="flex-1 q-mr-md"
                    :rules="[(val) => !!val || 'Label is required']"
                  />
                  <q-input
                    filled
                    v-model="phone.number"
                    label="Phone Number"
                    mask="(###) ###-####"
                    :rules="[(val) => !!val || 'Phone number is required']"
                    placeholder="(###) ###-####"
                    class="flex-1 q-mr-md"
                  />
                  <q-btn
                    flat
                    round
                    color="negative"
                    icon="delete"
                    @click="removePhone(index)"
                    :disable="lead.phones.length === 1"
                  />
                </div>
                <q-btn
                  label="Add Another Phone"
                  icon="add"
                  color="secondary"
                  flat
                  @click="addPhone"
                  class="q-mb-md"
                />

                <q-option-group
                  v-model="lead.gender"
                  label="Gender"
                  inline
                  class="flex q-mb-md"
                  :options="genderOptions"
                  :rules="[(val) => !!val || 'Gender is required']"
                />

                <q-checkbox
                  v-model="lead.interested"
                  label="Interested"
                  color="primary"
                  class="q-mb-md"
                />

                <q-btn
                  label="Get Current Location"
                  color="primary"
                  icon="place"
                  @click="getLocation"
                  class="full-width q-mt-md"
                />

                <q-input
                  filled
                  v-model="lead.location"
                  label="Location (GPS)"
                  readonly
                  prepend="my_location"
                />
              </q-card-section>

              <q-card-actions align="right" class="q-mb-md">
                <q-btn type="reset" label="Reset" color="grey" flat />
                <q-btn
                  type="submit"
                  :label="isEditing ? 'Update Lead' : 'Add Lead'"
                  color="primary"
                />
              </q-card-actions>
            </q-form>
          </q-card>
        </div>

        <!-- Map Container -->
        <div class="col-md-4 col-xs-12">
          <q-card class="map-container q-my-md q-pa-md">
            <q-card-section>
              <div class="text-h6">Location Map</div>
              <q-card-section v-if="mapUrl && lead.location">
                <iframe
                  :src="mapUrl"
                  width="100%"
                  height="300"
                  style="border: 0"
                  allowfullscreen=""
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                ></iframe>
              </q-card-section>
              <q-card-section v-else>
                <p class="text-grey">
                  No location selected. Click "Get Current Location" to view the
                  map.
                </p>
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useLeadStore } from "../stores/leadStore";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const leadStore = useLeadStore();

leadStore.loadLeadsFromLocalStorage();
const id = route.params.id ? parseInt(route.params.id, 10) : null;
const isEditing = ref(Boolean(id));

const leadForm = ref(null);

const lead = ref({
  name: "",
  email: "",
  activity: null,
  phones: [{ label: "", number: "" }],
  location: "",
  gender: null,
  interested: false,
});

const mapUrl = ref("");

const domains = ["Hotel", "Hardware Store", "Retail", "Other"];

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

const onSubmit = () => {
  leadForm.value.validate().then((isValid) => {
    if (!isValid) {
      return;
    }

    if (isEditing.value) {
      leadStore.updateLead(lead.value);
    } else {
      const newLead = {
        ...lead.value,
        id: generateRandomId(),
      };
      leadStore.addLead(newLead);
    }
    router.push("/");
  });
};

onMounted(() => {
  if (isEditing.value) {
    const existingLead = leadStore.getLeadById(id);
    if (existingLead) lead.value = existingLead;
  }
});

const resetForm = () => {
  lead.value = {
    name: "",
    email: "",
    activity: null,
    phones: [{ label: "", number: "" }],
    location: "",
    gender: null,
    interested: false,
  };
  mapUrl.value = "";
};

const addPhone = () => {
  lead.value.phones.push({ label: "", number: "" });
};

const removePhone = (index) => {
  lead.value.phones.splice(index, 1);
};

const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        lead.value.location = `${latitude}, ${longitude}`;
        updateMapUrl(latitude, longitude);
      },
      (error) => {
        console.error("Error fetching location", error);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
};

const updateMapUrl = (latitude, longitude) => {
  mapUrl.value = `https://www.openstreetmap.org/export/embed.html?bbox=${
    longitude - 0.005
  },${latitude - 0.005},${longitude + 0.005},${
    latitude + 0.005
  }&layer=mapnik&marker=${latitude},${longitude}`;
};

const generateRandomId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

// Watch the lead.location for changes and update mapUrl accordingly
watch(
  () => lead.value.location,
  (newLocation) => {
    if (newLocation) {
      // Coordinates assumed to be "latitude, longitude"
      const [latitude, longitude] = newLocation.split(",").map(Number);
      updateMapUrl(latitude, longitude);
    } else {
      mapUrl.value = "";
    }
  }
);
</script>

<style scoped>
.form-card {
  flex: 1;
}

.map-container {
  flex: 1;
  margin-top: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  overflow: hidden;
}

.phone-section {
  display: flex;
  align-items: center;
  border: 2px dashed #ccc;
  padding: 10px;
  border-radius: 8px;
}

.flex-1 {
  flex: 1;
}

.q-mr-md {
  margin-right: 10px;
}

.q-mb-md {
  margin-bottom: 10px;
}

.full-width {
  width: 100%;
}

.text-grey {
  color: #888;
}
</style>
